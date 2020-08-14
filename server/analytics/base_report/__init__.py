# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import json, current_app as app
from eve_elastic.elastic import set_filters, ElasticCursor

from superdesk import get_resource_service, es_utils
from superdesk.utils import ListCursor
from superdesk.utc import utcnow, get_timezone_offset
from superdesk.errors import SuperdeskApiError
from superdesk.es_utils import REPOS

from apps.search import SearchService

from analytics.common import MIME_TYPES, get_elastic_version, get_weekstart_offset_hr, DATE_FILTERS, \
    relative_to_absolute_datetime


class BaseReportService(SearchService):
    exclude_stages_with_global_read_off = True
    date_filter_field = 'versioncreated'
    histogram_source_field = 'versioncreated'

    defaultConfig = {}
    repos = REPOS

    def get_stages_to_exclude(self):
        """
        Overriding from the base SearchService so we can control which stages to include.
        """
        if self.exclude_stages_with_global_read_off:
            stages = get_resource_service('stages').get_stages_by_visibility(is_visible=False)
            return [str(stage['_id']) for stage in stages]

        return []

    def on_fetched(self, doc):
        """
        Overriding this method so the base SearchService doesn't construct custom HATEOS
        """
        pass

    def generate_report(self, docs, args):
        """
        Overwrite this method to generate a report based on the aggregation data
        """
        if args.get('aggs', 1) == 0:
            return docs

        return self.get_aggregation_buckets(docs.hits)

    def generate_highcharts_config(self, docs, args):
        """
        Overwrite this method to generate the highcharts config based on the aggregation data
        """
        return {}

    def generate_csv(self, docs, args):
        """
        Overwrite this method to generate the csv data based on the aggregation data
        """
        return {}

    def generate_html(self, docs, args):
        """
        Overwrite this method to generate the html table based on the aggregation data
        """
        return {}

    def get_aggregation_buckets(self, docs, aggregation_ids=None):
        """
        Retrieves the aggregation buckets from the documents provided
        """
        if aggregation_ids is None:
            aggregation_ids = self.aggregations.keys()

        buckets = {}

        for aggregation_id in aggregation_ids:
            aggregations = docs.get('aggregations') or {}
            buckets[aggregation_id] = (aggregations.get(aggregation_id) or {}).get('buckets') or []

        return buckets

    def get_aggregations(self, params, args):
        return self.aggregations

    def _get_histogram_aggregation(self, interval, args, aggregations):
        params = args.get('params') or {}
        lt, gte, time_zone = self._es_get_date_filters(params)

        # If the interval is weekly, then offset the buckets by the
        # starting day of the week, based on app.config['START_OF_WEEK']
        offset = 0 if interval != 'week' else get_weekstart_offset_hr()

        if lt.startswith('now'):
            extended_bounds = {
                'max': relative_to_absolute_datetime(lt, '%Y-%m-%dT%H:%M:%S'),
                'min': relative_to_absolute_datetime(gte, '%Y-%m-%dT%H:%M:%S')
            }
        else:
            extended_bounds = {
                'min': gte[:-5],  # remove timezone part
                'max': lt[:-5]  # remove timezone part
            }

        # dates.extended_bounds.min & dates.extended_bounds.max should use dates.format

        aggs = {
            'dates': {
                'date_histogram': {
                    'field': self.histogram_source_field,
                    'interval': interval,
                    'time_zone': time_zone,
                    'min_doc_count': 0,
                    'offset': '{}h'.format(offset),
                    'extended_bounds': extended_bounds,
                    'format': 'yyyy-MM-dd\'T\'HH:mm:ss'
                },
                'aggs': aggregations
            }
        }

        if get_elastic_version().startswith('1.'):
            aggs['dates']['date_histogram']['pre_zone_adjust_large_interval'] = True

        return aggs

    def get_histogram_interval(self, args):
        histogram = (args.get('params') or {}).get('histogram') or {}
        return histogram.get('interval')

    def get_histogram_interval_ms(self, args):
        interval = self.get_histogram_interval(args)

        hours = 1
        if interval == 'daily':
            hours = 24
        elif interval == 'weekly':
            hours = 168

        return 3600000 * hours  # (milliseconds in an hour) * number of hours

    def get_histogram_aggregation(self, aggs, params, args):
        interval = self.get_histogram_interval(args)

        if not interval:
            return aggs

        if interval == 'hourly':
            return self._get_histogram_aggregation('hour', args, aggs)
        elif interval == 'weekly':
            return self._get_histogram_aggregation('week', args, aggs)

        return self._get_histogram_aggregation('day', args, aggs)

    def get_request_aggregations(self, params, args):
        aggs = self.get_aggregations(params, args)
        return self.get_histogram_aggregation(aggs, params, args)

    def _get_request_or_lookup(self, req, **lookup):
        # Get the args as a dictionary from either the request or lookup object
        if getattr(req, 'args', None) is not None:
            # Convert to a normal dict (werkzeug passes through an ImmutableMultiDict)
            try:
                args = req.args.to_dict()
            except AttributeError:
                args = req.args
        else:
            args = {
                'source': lookup.get('source') or None,
                'params': lookup.get('params') or None,
                'repo': lookup.get('repo') or None,
                'return_type': lookup.get('return_type') or 'aggregations',
                'aggs': lookup.get('aggs') or None,
                'translations': lookup.get('translations') or None
            }

        # Args can either have source or params, not both
        # Also ensure the attributes are a dictionary not json string
        if args.get('source'):
            if isinstance(args['source'], str):
                args['source'] = json.loads(args['source'])
            args.pop('params', None)
        elif args.get('params'):
            if isinstance(args['params'], str):
                args['params'] = json.loads(args['params'])
            args.pop('source', None)

            # args['params']['aggs'] takes precedence over args['aggs']
            if args['params'].get('aggs'):
                args['aggs'] = args['params']['aggs']

        if 'aggs' in args:
            if isinstance(args['aggs'], str):
                args['aggs'] = json.loads(args['aggs'])
            elif args['aggs'] is None:
                del args['aggs']

        if 'translations' in args:
            if isinstance(args['translations'], str):
                args['translations'] = json.loads(args['translations'])
            elif args['translations'] is None:
                del args['translations']

        args['return_type'] = args.get('return_type', 'aggregations')

        return args

    def get_elastic_index(self, types):
        return es_utils.get_index(types)

    def run_query(self, params, args):
        query = params.get('source') or {}
        if 'query' not in query:
            query['query'] = {'filtered': {}}

        aggs = self.get_request_aggregations(params, args)
        if aggs:
            query['aggs'] = aggs

        types = params.get('repo')
        if not types:
            types = self.repos.copy()
        else:
            types = types.split(',')
            # If the repos array is still empty after filtering, then return the default repos
            types = [repo for repo in types if repo in self.repos] or self.repos.copy()

        excluded_stages = self.get_stages_to_exclude()
        filters = self._get_filters(types, excluded_stages)

        # if the system has a setting value for the maximum search depth then apply the filter
        if not app.settings['MAX_SEARCH_DEPTH'] == -1:
            query['terminate_after'] = app.settings['MAX_SEARCH_DEPTH']

        if filters:
            set_filters(query, filters)

        index = self.get_elastic_index(types)

        hits = self.elastic.es.search(
            body=query,
            index=index,
            doc_type=types,
            params={}
        )
        docs = self._get_docs(hits)

        for resource in types:
            response = {app.config['ITEMS']: [doc for doc in docs if doc['_type'] == resource]}
            getattr(app, 'on_fetched_resource')(resource, response)
            getattr(app, 'on_fetched_resource_%s' % resource)(response)

        return docs

    def get(self, req, **lookup):
        args = self._get_request_or_lookup(req, **lookup)

        if args.get('source'):
            params = {
                'source': args['source'],
                'repo': args.get('repo')
            }

            if args.get('aggs'):
                params['aggs'] = args['aggs']

        elif args.get('params'):
            params = self.generate_elastic_query(args)
            if args.get('aggs'):
                params['aggs'] = args['aggs']
        else:
            raise SuperdeskApiError.badRequestError('source/query not provided')

        docs = self.run_query(params, args)

        if args['return_type'] == 'highcharts_config':
            report = self.generate_highcharts_config(docs, args)
        elif args['return_type'] == MIME_TYPES.CSV:
            report = self.generate_csv(docs, args)
        elif args['return_type'] == MIME_TYPES.HTML:
            report = self.generate_html(docs, args)
        else:
            report = self.generate_report(docs, args)

        if 'include_items' in args and int(args['include_items']):
            report['_items'] = list(docs)

        if isinstance(report, list):
            return ListCursor(report)
        elif isinstance(report, ListCursor):
            return report
        elif isinstance(report, ElasticCursor):
            return report
        return ListCursor([report])

    def get_utc_offset(self):
        return get_timezone_offset(app.config['DEFAULT_TIMEZONE'], utcnow())

    def format_date(self, date, end_of_day=False):
        time_suffix = 'T23:59:59' if end_of_day else 'T00:00:00'
        utc_offset = self.get_utc_offset()

        return date + time_suffix + utc_offset

    def _es_get_filter_values(self, filters):
        if not isinstance(filters, dict):
            return filters

        return [name for name, value in filters.items() if value]

    def _es_filter_desks(self, query, desks, must, params):
        query[must].append({
            'terms': {'task.desk': desks}
        })

    def _es_filter_users(self, query, users, must, params):
        query[must].append({
            'terms': {'task.user': users}
        })

    def _es_filter_categories(self, query, categories, must, params):
        field = params.get('category_field') or 'qcode'

        query[must].append({
            'terms': {'anpa_category.{}'.format(field): sorted(categories)}
        })

    def _es_filter_sources(self, query, sources, must, params):
        query[must].append({
            'terms': {'source': sorted(sources)}
        })

    def _es_filter_genre(self, query, genres, must, params):
        query[must].append({
            'terms': {'genre.qcode': genres}
        })

    def _es_filter_urgencies(self, query, urgencies, must, params):
        query[must].append({
            'terms': {'urgency': urgencies}
        })

    def _es_filter_ingest_providers(self, query, ingests, must, params):
        query[must].append({
            'terms': {'ingest_provider': ingests}
        })

    def _es_filter_stages(self, query, stages, must, params):
        query[must].append({
            'terms': {'task.stage': stages}
        })

    def _es_filter_states(self, query, states, must, params):
        query[must].append({
            'terms': {'state': sorted(states)}
        })

    def _es_filter_content_types(self, query, content_types, must, params):
        query[must].append({
            'terms': {'type': sorted(content_types)}
        })

    def _es_filter_rewrites(self, query, value, must, params):
        if value:
            query[must].append({
                'exists': {'field': 'rewrite_of'}
            })

    def _es_include_rewrites(self, query, params):
        rewrites = params.get('rewrites') or 'include'

        if rewrites == 'include':
            return

        must = 'must' if rewrites == 'only' else 'must_not'

        query[must].append({
            "and": [
                {"term": {"state": "published"}},
                {"exists": {"field": "rewrite_of"}}
            ]
        })

    def _es_set_repos(self, query, params):
        query['repo'] = ','.join([
            repo
            for repo, value in sorted((params.get('repos') or {}).items())
            if value and repo
        ])

    def _es_set_size(self, query, params):
        query['size'] = params.get('size') or 0

        if 'page' in params:
            query['page'] = params['page']

    def _es_set_sort(self, query, params):
        query['sort'] = params.get('sort') or [{self.date_filter_field: 'desc'}]

    def _es_get_date_filters(self, params):
        dates = params.get('dates') or {}
        date_filter = dates.get('filter')
        if not date_filter:
            return None, None, None

        start_date = dates.get('start')
        end_date = dates.get('end')
        date = dates.get('date')
        relative = dates.get('relative')

        time_zone = self.get_utc_offset()
        lt = None
        gte = None

        if date_filter == DATE_FILTERS.RANGE:
            lt = self.format_date(end_date, True)
            gte = self.format_date(start_date)
        elif date_filter == DATE_FILTERS.DAY:
            lt = self.format_date(date, True)
            gte = self.format_date(date)
        elif date_filter == DATE_FILTERS.YESTERDAY:
            lt = 'now/d'
            gte = 'now-1d/d'
        elif date_filter == DATE_FILTERS.LAST_WEEK:
            lt = 'now/w'
            gte = 'now-1w/w'
        elif date_filter == DATE_FILTERS.LAST_MONTH:
            lt = 'now/M'
            gte = 'now-1M/M'
        elif date_filter == DATE_FILTERS.RELATIVE_HOURS:
            lt = 'now'
            gte = 'now-{}h/h'.format(relative)
        elif date_filter == DATE_FILTERS.RELATIVE_DAYS:
            lt = 'now'
            gte = 'now-{}d/d'.format(relative)
        elif date_filter == DATE_FILTERS.TODAY:
            lt = 'now'
            gte = 'now/d'
        elif date_filter == DATE_FILTERS.THIS_WEEK:
            lt = 'now'
            gte = 'now/w'
        elif date_filter == DATE_FILTERS.THIS_MONTH:
            lt = 'now'
            gte = 'now/M'
        elif date_filter == DATE_FILTERS.RELATIVE_WEEKS:
            lt = 'now'
            gte = 'now-{}w/d'.format(relative)
        elif date_filter == DATE_FILTERS.RELATIVE_MONTHS:
            lt = 'now'
            gte = 'now-{}M/d'.format(relative)
        elif date_filter == DATE_FILTERS.LAST_YEAR:
            lt = 'now/y'
            gte = 'now-1y/y'
        elif date_filter == DATE_FILTERS.THIS_YEAR:
            lt = 'now'
            gte = 'now/y'

        return lt, gte, time_zone

    def _es_filter_dates(self, query, params):
        lt, gte, time_zone = self._es_get_date_filters(params)

        if lt is not None and gte is not None:
            query['must'].append({
                DATE_FILTERS.RANGE: {
                    self.date_filter_field: {
                        'lt': lt,
                        'gte': gte,
                        'time_zone': time_zone
                    }
                }
            })

    def _get_es_query_funcs(self):
        return {
            'desks': {
                'query': self._es_filter_desks,
                'values': self._es_get_filter_values
            },
            'users': {
                'query': self._es_filter_users,
                'values': self._es_get_filter_values
            },
            'categories': {
                'query': self._es_filter_categories,
                'values': self._es_get_filter_values
            },
            'sources': {
                'query': self._es_filter_sources,
                'values': self._es_get_filter_values
            },
            'genre': {
                'query': self._es_filter_genre,
                'values': self._es_get_filter_values
            },
            'urgency': {
                'query': self._es_filter_urgencies,
                'values': self._es_get_filter_values
            },
            'ingest_providers': {
                'query': self._es_filter_ingest_providers,
                'values': self._es_get_filter_values
            },
            'stages': {
                'query': self._es_filter_stages,
                'values': self._es_get_filter_values
            },
            'content_types': {
                'query': self._es_filter_content_types,
                'values': self._es_get_filter_values
            },
            'states': {
                'query': self._es_filter_states,
                'values': self._es_get_filter_values
            },
            'rewrites': {
                'query': self._es_filter_rewrites,
                'values': self._es_get_filter_values
            },
        }

    def _es_base_query(self, query, params):
        self._es_set_repos(query, params)
        self._es_set_size(query, params)
        self._es_set_sort(query, params)
        self._es_filter_dates(query, params)
        self._es_include_rewrites(query, params)

    def generate_elastic_query(self, args):
        params = args.get('params') or {}

        query_funcs = self._get_es_query_funcs()
        query = {
            'must': [],
            'must_not': [],
            'sort': [],
            'should': []
        }

        self._es_base_query(query, params)

        for must in ['must', 'must_not']:
            for field, filters in (params.get(must) or {}).items():
                if isinstance(filters, list) and len(filters) < 1:
                    continue
                elif isinstance(filters, bool) and not filters:
                    continue
                elif filters is None:
                    continue

                funcs = query_funcs.get(field)

                values = filters if not funcs.get('values') else funcs['values'](filters)
                func = funcs.get('query')

                if (isinstance(values, list) and len(values) < 1) or not func:
                    continue

                func(query, values, must, params)

        es_query = {
            'source': {
                'query': {
                    'filtered': {
                        'filter': {
                            'bool': {
                                'must': query['must'],
                                'must_not': query['must_not']
                            },
                        },
                    },
                }
            }
        }

        query_keys = query.keys()

        if len(query.get('should') or []) > 0:
            es_query['source']['query']['filtered']['filter']['bool']['should'] = \
                query['should']

        if 'minimum_should_match' in query_keys:
            es_query['source']['query']['filtered']['filter']['bool']['minimum_should_match'] = \
                query['minimum_should_match']

        if 'size' in query_keys:
            es_query['source']['size'] = query['size']

            page = query.get('page') or 1
            es_query['source']['from'] = (page - 1) * query['size']
            es_query['page'] = query.get('page') or 1
            es_query['max_results'] = query['size']

        if 'sort' in query_keys:
            es_query['source']['sort'] = query['sort']

        if len(query['repo']) > 0:
            es_query['repo'] = query['repo']

        if query.get('aggs'):
            es_query['aggs'] = query['aggs']

        return es_query
