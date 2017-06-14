# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2016 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from datetime import datetime
import json
from superdesk import get_resource_service
from superdesk.services import BaseService

from eve.utils import ParsedRequest
from superdesk.metadata.item import metadata_schema
from superdesk.resource import Resource
from superdesk.utils import format_date
from datetime import timedelta


class ContentQuotaReportResource(Resource):
    """Content v Quota Report schema
    """

    schema = {
        'start_time': {'type': 'datetime', 'required': False, 'nullable': True},
        'subject': metadata_schema['subject'],
        'keywords': metadata_schema['keywords'],
        'category': metadata_schema['anpa_category'],
        'intervals_number': {'type': 'integer'},
        'interval_length': {'type': 'integer'},
        'target': {'type': 'integer'},
        'report': {'type': 'dict'}
    }
    item_methods = ['GET', 'DELETE']
    resource_methods = ['POST']

    privileges = {'POST': 'content_quota_report', 'DELETE': 'content_quota_report',
                  'GET': 'content_quota_report'}


class ContentQuotaReportService(BaseService):

    interval_length_default = 5
    no_of_intervals_default = 1

    def set_query_terms(self, report):
        """Check if some fields are filled out before generating the report and initiate the filter
        """
        start_time = report['start_time'] if 'start_time' in report else datetime.now()
        interval_length = timedelta(int(report['interval_length'])
                                    if report.get('interval_length') else self.interval_length_default)
        no_of_intervals = report['intervals_number'] if report.get('intervals_number') \
            else self.no_of_intervals_default
        end_time = format_date((start_time - interval_length * no_of_intervals)
                               .replace(hour=0, minute=0, second=0, microsecond=0))

        terms = [
            {'range': {'_updated': {'lte': format_date(start_time), 'gte': end_time}}},
            {'term': {'operation': 'publish'}},
            {'not': {'term': {'package_type': 'takes'}}}
        ]

        if report.get('subject'):
            subjects = [subject['qcode'] for subject in report['subject']]
            terms.append({'terms': {'subject.qcode': subjects}})
        if report.get('keywords'):
            key = [x.lower() for x in report['keywords']]
            terms.append({'terms': {'keywords': key}})
        if report.get('category'):
            categories = [category['qcode'] for category in report['category']]
            terms.append({'terms': {'anpa_category.qcode': categories}})

        return terms

    def get_items(self, query):
        """Return the result of the item search by the given query
        """
        request = ParsedRequest()
        request.args = {'source': json.dumps(query), 'repo': 'published'}
        return get_resource_service('search').get(req=request, lookup=None)

    def generate_report(self, doc):
        """Returns a report on how many items were created against a quota.

        The report will show the items that were created during a time interval.
        :param dict doc: document used for generating the report
        :return dict: report
        """

        interval_length = timedelta(int(doc['interval_length'])
                                    if doc.get('interval_length') else self.interval_length_default)
        no_of_intervals = doc['intervals_number'] if doc.get('intervals_number') \
            else self.no_of_intervals_default

        start_time = doc['start_time'] if 'start_time' in doc else datetime.now()
        time_intervals = []
        for i in range(no_of_intervals + 1):
            time_intervals.append(start_time - interval_length * i)

        terms = self.set_query_terms(doc)
        query = {
            "query": {
                "filtered": {
                    "filter": {
                        "bool": {"must": terms}
                    }
                }
            }
        }

        items = self.get_items(query)
        if 'aggregations' in items.hits and 'items_over_days' in items.hits['aggregations']:
            items_over_day_buckets = items.hits['aggregations']['items_over_days']['buckets']
        i = 0
        result_list = []
        while i < len(time_intervals) - 1:
            results = {}
            results['start_time'] = time_intervals[i]
            results['end_time'] = time_intervals[i + 1]
            for bucket in items_over_day_buckets:
                if bucket['key_as_string'].rsplit('T', 1)[0] <= str(time_intervals[i]) \
                        and bucket['key_as_string'].rsplit('T', 1)[0] > str(time_intervals[i + 1]):
                    results['items_total'] = bucket['doc_count']
            result_list.append(results)
            i = i + 1

        return [item for item in result_list]

    def create(self, docs):
        for doc in docs:
            doc['timestamp'] = datetime.now()
            doc['report'] = self.generate_report(doc)
        docs = super().create(docs)
        return docs
