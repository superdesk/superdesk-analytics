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
                'source': lookup.get('source', None),
                'params': lookup.get('params', None),
                'repo': lookup.get('repo', None),
                'return_type': lookup.get('return_type', 'aggregations')
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

        args['return_type'] = args.get('return_type', 'aggregations')

        return args

    def get(self, req, **lookup):
        args = self._get_request_or_lookup(req, **lookup)

        if args.get('source'):
            params = {
                'source': args['source'],
                'repo': args.get('repo')
            }
        elif args.get('params'):
            params = self.generate_elastic_query(args)
        else:
            raise SuperdeskApiError.badRequestError('source/query not provided')

        request = self.get_parsed_request(params)
        docs = super().get(request, lookup=None)

        if args['return_type'] == 'highcharts_config':
            report = self.generate_highcharts_config(docs, args)
        elif args['return_type'] == MIME_TYPES.CSV:
            report = self.generate_csv(docs, args)
        else:
            report = self.generate_report(docs, args)

        if 'include_items' in args and int(args['include_items']):
            report['_items'] = list(docs)

        return ListCursor([report])

    def generate_elastic_query(self, args):
        params = args.get('params') or {}

        filters = {
            'must': [],
            'must_not': []
        }

        def get_utc_offset():
            return get_timezone_offset(app.config['DEFAULT_TIMEZONE'], utcnow())

        def format_date(date, end_of_day=False):
            time_suffix = 'T23:59:59' if end_of_day else 'T00:00:00'
            utc_offset = get_utc_offset()

            return date + time_suffix + utc_offset

        def filter_dates():
            date_filter = params.get('date_filter')
            if not date_filter:
                return

            time_zone = get_utc_offset()
            lt = None
            gte = None

            if date_filter == 'range':
                lt = format_date(params.get('end_date'), True)
                gte = format_date(params.get('start_date'))
            elif date_filter == 'yesterday':
                lt = 'now/d'
                gte = 'now-1d/d'
            elif date_filter == 'last_week':
                lt = 'now/w'
                gte = 'now-1w/w'
            elif date_filter == 'last_month':
                lt = 'now/M'
                gte = 'now-1M/M'

            if lt is not None and gte is not None:
                filters['must'].append({
                    'range': {
                        'versioncreated': {
                            'lt': lt,
                            'gte': gte,
                            'time_zone': time_zone
                        }
                    }
                })

        def exclude_states():
            states = params.get('excluded_states')
            if not states:
                return

            exclude = [state for state, enabled in states.items() if enabled]

            if not len(exclude):
                return

            filters['must_not'].append({'terms': {'state': sorted(exclude)}})

        def get_repos():
            repos = params.get('repos')
            if not repos:
                return

            return ','.join([repo for repo, enabled in sorted(repos.items()) if enabled])

        def filter_categories():
            categories = params.get('categories')
            if not categories:
                return

            categories = [category for category, enabled in categories.items() if enabled]

            if not len(categories):
                return

            filters['must'].append({'terms': {'anpa_category.name': sorted(categories)}})

        def filter_sources():
            sources = params.get('sources')
            if not sources:
                return

            sources_list = [source for source, enabled in sources.items() if enabled]

            if not len(sources_list):
                return

            filters['must'].append({'terms': {'source': sorted(sources_list)}})

        def filter_rewrites():
            if not params.get('exclude_rewrites'):
                return

            filters['must_not'].append({'exists': {'field': 'rewrite_of'}})

        def get_size():
            return params.get('size') or 0

        filter_dates()
        exclude_states()
        filter_categories()
        filter_sources()
        filter_rewrites()
        repo = get_repos()

        query = {
            'source': {
                'query': {'filtered': {'filter': {'bool': filters}}},
                'sort': [{'versioncreated': 'desc'}],
                'size': get_size()
            }
        }

        if repo:
            query['repo'] = repo

        return query
