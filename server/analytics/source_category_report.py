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

from analytics.base_report import BaseReportService


class SourceCategoryReportResource(Resource):
    """Categories per source report schema
    """

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'source_category_report'}


class SourceCategoryReportService(BaseReportService):
    aggregations = {
        'source_category': {
            'terms': {
                'field': 'source',
                'size': 0
            },
            'aggs': {
                'category': {
                    'terms': {
                        'field': 'anpa_category.qcode',
                        'size': 0
                    }
                }
            }
        }
    }

    def generate_report(self, docs, params):
        """Returns the category count and categories per source counts.

        :param docs: document used for generating the report
        :return dict: report
        """
        agg_buckets = self.get_aggregation_buckets(docs.hits)
        cv = get_resource_service('vocabularies').find_one(req=None, _id='categories')

        categories_by_qcode = {
            category.get('qcode'): category for category in cv['items'] if category.get('is_active', True)
        }

        report = {
            'categories': {category.get('name'): 0 for category in cv['items'] if category.get('is_active', True)},
            'sources': {}
        }

        for source in agg_buckets.get('source_category') or []:
            source_key = source.get('key')

            # If for some reason we don't find a source key, then skip this entry
            if not source_key:
                continue

            report['sources'][source_key] = {}

            for category in (source.get('category') or {}).get('buckets') or []:
                qcode = category.get('key')
                category_key = (categories_by_qcode.get(qcode) or {}).get('name')

                # If for some reason we don't find a category key, then skip this entry
                if not category_key:
                    continue

                if category_key not in report['categories']:
                    report['categories'][category_key] = 0

                report['sources'][source_key][category_key] = category.get('doc_count') or 0
                report['categories'][category_key] += report['sources'][source_key][category_key]

        return report
