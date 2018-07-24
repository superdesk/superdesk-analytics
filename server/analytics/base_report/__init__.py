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

from apps.search import SearchService


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

    def generate_report(self, docs, params):
        """
        Overwrite this method to generate a report based on the aggregation data
        """
        return self.get_aggregation_buckets(docs.hits)

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

    def get(self, req, lookup):
        args = getattr(req, 'args', {})
        params = {
            'source': json.loads(args.get('source') or '{}'),
            'repo': args.get('repo')
        }

        request = self.get_parsed_request(params)
        docs = super().get(request, lookup)
        report = self.generate_report(docs, params)

        if 'include_items' in args and int(args['include_items']):
            report['_items'] = list(docs)

        return ListCursor([report])
