# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService
from analytics.aggregations import get_aggregations, SOURCE_CATEGORY, source_category_aggregation

from flask import json
from eve.utils import ParsedRequest


class SourceCategoryReportResource(Resource):
    """Categories per source report schema
    """

    schema = {
        'query': {'type': 'dict', 'required': True},
        'repos': {'type': 'list', 'default': ['published', 'archived']}
    }

    item_methods = ['GET', 'DELETE']
    resource_methods = ['POST']

    privileges = {
        'POST': 'source_category_report',
        'DELETE': 'source_category_report',
        'GET': 'source_category_report'
    }


class SourceCategoryReportService(BaseService):
    def generate_report(self, doc):
        """Returns the category count and categories per source counts.

        :param dict doc: document used for generating the report
        :return dict: report
        """
        repos = doc.get('repos') or ['published', 'archived']
        request = ParsedRequest()
        request.args = {
            'source': json.dumps(doc.get('query') or {}),
            'repo': ','.join(repos),
            'aggregations': 1
        }

        agg_buckets = get_aggregations([source_category_aggregation], request)

        cv = get_resource_service('vocabularies').find_one(req=None, _id='categories')

        report = {
            'categories': {category.get('name'): 0 for category in cv['items'] if category.get('is_active')},
            'sources': {}
        }

        for source in (agg_buckets.get(SOURCE_CATEGORY) or {}).get('buckets') or []:
            source_key = source.get('key')

            # If for some reason we don't find a source key, then skip this entry
            if not source_key:
                continue

            report['sources'][source_key] = {}

            for category in (source.get('category') or {}).get('buckets') or []:
                category_key = category.get('key')

                # If for some reason we don't find a category key, then skip this entry
                if not category_key:
                    continue

                if category_key not in report['categories']:
                    report['categories'][category_key] = 0

                report['sources'][source_key][category_key] = category.get('doc_count') or 0
                report['categories'][category_key] += report['sources'][source_key][category_key]

        return report

    def create(self, docs):
        """Generate the reports based on the query/repo provided"""
        for doc in docs:
            doc['report'] = self.generate_report(doc)
        return super().create(docs)
