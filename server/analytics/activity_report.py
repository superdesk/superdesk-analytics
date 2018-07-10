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
from eve.default_settings import ID_FIELD
from superdesk.errors import SuperdeskApiError
from analytics.aggregations import ITEMS_OVER_DAYS, ITEMS_OVER_HOURS, \
    items_over_days_aggregation, items_over_hours_aggregation
from superdesk.metadata.utils import aggregations_manager


class ActivityReportResource(Resource):
    """Activity Report schema
    """

    schema = {
        'operation': {'type': 'string', 'required': True},
        'desk': Resource.rel('desks'),
        'operation_start_date': {'type': 'datetime', 'required': True},
        'operation_end_date': {'type': 'datetime', 'required': True},
        'subject': metadata_schema['subject'],
        'keywords': metadata_schema['keywords'],
        'category': metadata_schema['anpa_category'],
        'urgency_start': metadata_schema['urgency'],
        'urgency_end': metadata_schema['urgency'],
        'priority_start': metadata_schema['priority'],
        'priority_end': metadata_schema['priority'],
        'subscriber': {'type': 'string'},
        'group_by': {'type': 'list'},
        'report': {'type': 'dict'},
        'timestamp': {'type': 'datetime'},
        'force_regenerate': {'type': 'boolean', 'default': False}
    }
    item_methods = ['GET', 'DELETE']
    resource_methods = ['POST']

    privileges = {'POST': 'activity_report', 'DELETE': 'activity_report', 'GET': 'activity_report'}


class ActivityReportService(BaseService):
    hourly_treshold = 2

    def set_query_terms(self, report):
        """Check if some fields are filled out before generating the report and initiate the filter
        """
        terms = [
            {"term": {"operation": report['operation']}}
        ]
        if report.get('subject'):
            subjects = [subject['qcode'] for subject in report['subject']]
            terms.append({'terms': {'subject.qcode': subjects}})
        if report.get('keywords'):
            key = [x.lower() for x in report['keywords']]
            terms.append({'terms': {'keywords': key}})
        if report.get('operation_start_date') and report.get('operation_end_date'):
            op_date_start = format_date(report['operation_start_date'])
            op_date_end = format_date(report['operation_end_date'])
            terms.append({'range': {'versioncreated': {'gte': op_date_start, 'lte': op_date_end}}})
        if report.get('category'):
            categories = [category['qcode'] for category in report['category']]
            terms.append({'terms': {'anpa_category.qcode': categories}})
        if report.get('urgency_start') and report.get('urgency_end'):
            urgency_start = report['urgency_start']
            urgency_end = report['urgency_end']
            terms.append({'range': {'urgency': {'gte': urgency_start, 'lte': urgency_end}}})
        if report.get('priority_start') and report.get('priority_end'):
            priority_start = report['priority_start']
            priority_end = report['priority_end']
            terms.append({'range': {'priority': {'gte': priority_start, 'lte': priority_end}}})
        if report.get('subscriber'):
            subscriber = report['subscriber']
            terms.append({'terms': {'target_subscribers.name': [subscriber]}})

        return terms

    def get_items(self, query):
        """Return the result of the item search by the given query
        """
        request = ParsedRequest()
        request.args = {'source': json.dumps(query), 'repo': 'archive,published,archived,ingest'}
        with aggregations_manager([items_over_days_aggregation, items_over_hours_aggregation]):
            return get_resource_service('search').get(req=request, lookup=None)

    def search_items_without_groupping(self, report):
        """Return the report without grouping by desk
        """
        terms = self.set_query_terms(report)
        terms.append({"term": {"task.desk": str(report['desk'])}})
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

        diff_days = report['operation_end_date'] - report['operation_start_date']
        if diff_days.days < self.hourly_treshold:
            report = {'total': items.count(), 'items_per_hour': self.get_items_hourly(items)}
        else:
            report = {'total': items.count(), 'items_per_day': self.get_items_daily(items)}

        return report

    def get_items_daily(self, items):
        new_format = "%Y-%m-%d"
        dict_of_days = {}

        if 'aggregations' in items.hits and ITEMS_OVER_DAYS in items.hits['aggregations']:
            days_buckets = items.hits['aggregations'][ITEMS_OVER_DAYS]['buckets']

            for d in days_buckets:
                days = datetime.strptime(d['key_as_string'], "%Y-%m-%dT%H:%M:%S.%fZ")
                dict_of_days[days.strftime(new_format)] = d['doc_count']
        return dict_of_days

    def get_items_hourly(self, items):
        new_format = "%Y-%m-%d %H:00"
        dict_of_hours = {}

        if 'aggregations' in items.hits and ITEMS_OVER_HOURS in items.hits['aggregations']:
            hours_buckets = items.hits['aggregations'][ITEMS_OVER_HOURS]['buckets']

            for hour in hours_buckets:
                hours = datetime.strptime(hour['key_as_string'], "%Y-%m-%dT%H:%M:%S.%fZ")
                dict_of_hours[hours.strftime(new_format)] = hour['doc_count']
            return dict_of_hours

    def search_items_with_groupping(self, report):
        """Return the report without grouping by desk
        """
        query = {
            "query": {
                "filtered": {
                    "filter": {
                        "bool": {"must": self.set_query_terms(report)}
                    }
                }
            }
        }
        items = self.get_items(query)

        if 'aggregations' in items.hits and 'desk' in items.hits['aggregations']:
            desk_buckets = items.hits['aggregations']['desk']['buckets']
        else:
            desk_buckets = []
        result_list = []
        for desk in get_resource_service('desks').get(req=None, lookup={}):
            desk_item_count = self._desk_item_count(desk_buckets, desk[ID_FIELD])
            result_list.append({'desk': desk['name'], 'items': desk_item_count})
        return result_list

    def _desk_item_count(self, bucket, desk_id):
        for desk_stats in bucket:
            if desk_stats['key'] == str(desk_id):
                return desk_stats['doc_count']
        return 0

    def _validate_start_end_dates(self, doc):
        try:
            if doc['operation_start_date'] > doc['operation_end_date']:
                raise SuperdeskApiError.badRequestError('Operation end date must be '
                                                        'greater than the operation start date')
        except TypeError:
            raise SuperdeskApiError.badRequestError("Dates must be in ISO 8601 format without timezone")

    def create(self, docs):
        for doc in docs:
            self._validate_start_end_dates(doc)
            if 'group_by' not in doc and 'desk' not in doc:
                raise SuperdeskApiError.badRequestError('The desk is required')

        for doc in docs:
            doc['timestamp'] = datetime.now()
            if doc.get('group_by'):
                doc['report'] = self.search_items_with_groupping(doc)
            else:
                doc['report'] = self.search_items_without_groupping(doc)
        docs = super().create(docs)
        return docs
