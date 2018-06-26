# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2016 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.metadata.utils import add_aggregation, remove_aggregation
from superdesk.utils import format_date

from flask import json
from eve.utils import ParsedRequest


class SourceCategoryReportResource(Resource):
    """Track user's items schema
    """

    schema = {
        'start_date': {'type': 'datetime', 'required': True},
        'end_date': {'type': 'datetime', 'required': True}
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
        """Returns a report on elapsed time between started and resolved item.

        The report will contain the date since a user started the work on an item until he resolved that item.
        :param dict doc: document used for generating the report
        :return dict: report
        """

        add_aggregation("source", {
            "terms": {
                "field": "source",
                "size": 0
            },
            "aggs": {
                "category": {
                    "terms": {
                        "field": "anpa_category.name",
                        "size": 0
                    }
                }
            }
        })

        query = {
            "query": {
                "filtered": {
                    "filter": {
                        "bool": {
                            "must_not": [
                                {"term": {"state": {"value": "corrected"}}},
                                {"term": {"state": {"value": "killed"}}}
                            ],
                            "must": [{
                                "range": {
                                    "versioncreated": {
                                        "lt": format_date(doc.get('end_date')),
                                        "gte": format_date(doc.get('start_date')),
                                    }
                                }
                            }]
                        }
                    }
                }
            },
            "size": 0,
        }

        request = ParsedRequest()
        request.args = {
            'source': json.dumps(query),
            'repo': 'published,archived',
            'aggregations': 1
        }
        items = get_resource_service('search').get(req=request, lookup=None)
        remove_aggregation('source')

        agg_buckets = {}
        if 'aggregations' in items.hits and 'source' in items.hits['aggregations']:
            agg_buckets = items.hits['aggregations']['source']

        cv = get_resource_service('vocabularies').find_one(req=None, _id='categories')
        category_totals = {category.get('name'): 0 for category in cv['items'] if category.get('is_active')}

        sources = {}

        for source in agg_buckets.get('buckets') or []:
            source_key = source.get('key')

            # If for some reason we don't find a source key, then skip this entry
            if not source_key:
                continue

            sources[source_key] = {}

            for category in (source.get('category') or {}).get('buckets') or []:
                category_key = category.get('key')

                # If for some reason we don't find a category key, then skip this entry
                if not category_key:
                    continue

                sources[source_key][category_key] = category.get('doc_count') or 0

                # Increment the category totals (so that we can sort the categories from highest to lowest)
                category_totals[category_key] += sources[source_key][category_key]

        report = {
            'categories': [category for category in sorted(category_totals, key=category_totals.get, reverse=True)],
            'series': []
        }

        for source, bucket in sources.items():
            report['series'].append({
                'name': source,
                'data': [bucket.get(category) or 0 for category in report['categories']]
            })

        return report

    def create(self, docs):
        for doc in docs:
            doc['report'] = self.generate_report(doc)
        return super().create(docs)
