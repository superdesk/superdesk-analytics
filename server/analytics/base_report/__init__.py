# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from flask import json
from eve.utils import ParsedRequest

from superdesk import get_resource_service
from superdesk.utils import ListCursor
from superdesk.utc import utcnow, get_timezone_offset
from superdesk.errors import SuperdeskApiError

from apps.search import SearchService

from analytics.common import MIME_TYPES

from flask import current_app as app


class BaseReportService(SearchService):
    exclude_stages_with_global_read_off = True
    date_filter_field = 'versioncreated'

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

    def get_parsed_request(self, params):
        """
        Intercept the request args to proxy the request to the search endpoint
        """
        # Make sure the source is well formed before constructing the request
        # This is because the search endpoint required source["query"]["filtered"] to be defined
        source = params.get('source') or {}
        if 'query' not in source:
            source['query'] = {'filtered': {}}

        request = ParsedRequest()
        request.args = {
            'source': json.dumps(source),
            'repo': params.get('repo'),
            'aggregations': 1
        }

        if params.get('aggs'):
            request.args['aggs'] = json.dumps(params['aggs'])

        return request

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

    def run_query(self, request, params):
        return super().get(request, lookup=None)

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

        request = self.get_parsed_request(params)
        docs = self.run_query(request, params)

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

    def _es_set_sort(self, query, params):
        query['sort'] = params.get('sort') or [{self.date_filter_field: 'desc'}]

    def _es_filter_dates(self, query, params):
        dates = params.get('dates') or {}
        date_filter = params.get('date_filter') or dates.get('filter')
        if not date_filter:
            return

        start_date = params.get('start_date') or dates.get('start')
        end_date = params.get('end_date') or dates.get('end')
        date = params.get('date') or dates.get('date')
        relative = dates.get('relative')

        time_zone = self.get_utc_offset()
        lt = None
        gte = None

        if date_filter == 'range':
            lt = self.format_date(end_date, True)
            gte = self.format_date(start_date)
        elif date_filter == 'day':
            lt = self.format_date(date, True)
            gte = self.format_date(date)
        elif date_filter == 'yesterday':
            lt = 'now/d'
            gte = 'now-1d/d'
        elif date_filter == 'last_week':
            lt = 'now/w'
            gte = 'now-1w/w'
        elif date_filter == 'last_month':
            lt = 'now/M'
            gte = 'now-1M/M'
        elif date_filter == 'relative':
            lt = 'now'
            gte = 'now-{}h'.format(relative)

        if lt is not None and gte is not None:
            query['must'].append({
                'range': {
                    self.date_filter_field: {
                        'lt': lt,
                        'gte': gte,
                        'time_zone': time_zone
                    }
                }
            })

    def generate_elastic_query(self, args):
        params = args.get('params') or {}

        query_funcs = {
            'desks': self._es_filter_desks,
            'users': self._es_filter_users,
            'categories': self._es_filter_categories,
            'sources': self._es_filter_sources,
            'genre': self._es_filter_genre,
            'urgency': self._es_filter_urgencies,
            'ingest_providers': self._es_filter_ingest_providers,
            'stages': self._es_filter_stages,
            'states': self._es_filter_states,
            'rewrites': self._es_filter_rewrites
        }

        query = {
            'must': [],
            'must_not': [],
            'sort': [],
            'size': 0
        }

        self._es_set_repos(query, params)
        self._es_set_size(query, params)
        self._es_set_sort(query, params)
        self._es_filter_dates(query, params)
        self._es_include_rewrites(query, params)

        for must in ['must', 'must_not']:
            for field, filters in (params.get(must) or {}).items():
                values = self._es_get_filter_values(filters)
                func = query_funcs.get(field)

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
                },
                'sort': query['sort'],
                'size': query['size']
            }
        }

        if len(query['repo']) > 0:
            es_query['repo'] = query['repo']

        if query.get('aggs'):
            es_query['aggs'] = query['aggs']

        return es_query
