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
from superdesk.services import BaseService
from superdesk.resource import Resource
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError

from analytics.common import mime_types, MIME_TYPES

from collections import namedtuple
from copy import deepcopy

frequencies = ['hourly', 'daily', 'weekly', 'monthly']
FREQUENCIES = namedtuple('FREQUENCIES', ['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'])(*frequencies)


class ScheduledReportsResource(Resource):
    endpoint_name = resource_title = 'scheduled_reports'
    url = 'scheduled_reports'
    item_methods = ['GET', 'PATCH', 'DELETE']
    resource_methods = ['GET', 'POST']
    privileges = {
        'GET': 'scheduled_reports',
        'POST': 'scheduled_reports',
        'PATCH': 'scheduled_reports',
        'DELETE': 'scheduled_reports',
    }

    schema = {
        'saved_report': Resource.rel('saved_reports'),
        'report_type': {
            'type': 'string',
            'required': True
        },
        'schedule': {
            'type': 'dict',
            'required': True,
            'schema': {
                'frequency': {
                    'type': 'string',
                    'required': True,
                    'allowed': [
                        'hourly',
                        'daily',
                        'weekly',
                        'monthly'
                    ]
                },
                'hour': {
                    'type': 'integer',
                    'default': -1
                },
                'day': {
                    'type': 'integer',
                    'default': -1
                },
                'week_days': {
                    'type': 'list',
                    'schema': {
                        'type': 'string',
                        'allowed': [
                            'Sunday',
                            'Monday',
                            'Tuesday',
                            'Wednesday',
                            'Thursday',
                            'Friday',
                            'Saturday'
                        ]
                    }
                }
            }
        },
        'mimetype': {
            'type': 'string',
            'required': True,
            'allowed': mime_types,
            'default': MIME_TYPES.PNG
        },
        'report_width': {
            'type': 'integer',
            'default': 800
        },
        'transmitter': {
            'type': 'string',
            'required': True,
            'allowed': ['email']
        },
        'recipients': {
            'type': 'list',
            'required': True,
            'schema': {'type': 'string'}
        },
        'name': {  # used to construct email subject
            'type': 'string',
            'required': True
        },
        'description': {
            'type': 'string'
        },
        'active': {
            'type': 'boolean',
            'default': False
        },
        'extra': {
            'type': 'dict'  # i.e. email body
        },
        '_last_sent': {
            'type': 'datetime'
        }
    }


class ScheduledReportsService(BaseService):
    def on_created(self, docs):
        for doc in docs:
            self.set_schedule(doc)
            self._validate_on_create_or_update(doc)
            self._push_notification(doc, 'create')

    def on_updated(self, updates, original):
        self.set_schedule(updates)
        doc = deepcopy(original)
        doc.update(updates)
        self._validate_on_create_or_update(doc)
        self._push_notification(original, 'update')

    def on_deleted(self, doc):
        self._push_notification(doc, 'delete')

    def set_schedule(self, updates):
        # Sometimes 'schedule' is not in the updates provided
        # Eve/Cerberus will ensure the document has 'schedule' set
        # as it is configured as required
        if not updates.get('schedule'):
            return

        schedule = updates.get('schedule') or {}
        hour = schedule.get('hour', -1)
        day = schedule.get('day', -1)
        week_days = schedule.get('week_days') or []
        frequency = schedule.get('frequency') or 'hourly'

        # Fix issue with incorrect schedule attributes being stored
        if frequency == 'hourly':
            updates['schedule'].update({
                'frequency': 'hourly',
                'hour': -1,
                'day': -1,
                'week_days': []
            })
        elif frequency == 'daily':
            updates['schedule'].update({
                'frequency': 'daily',
                'hour': hour,
                'day': -1,
                'week_days': []
            })
        elif frequency == 'weekly':
            updates['schedule'].update({
                'frequency': 'weekly',
                'hour': hour,
                'day': -1,
                'week_days': week_days
            })
        elif frequency == 'monthly':
            updates['schedule'].update({
                'frequency': 'monthly',
                'hour': hour,
                'day': day,
                'week_days': []
            })

    @staticmethod
    def _validate_on_create_or_update(doc):
        saved_service = get_resource_service('saved_reports')
        saved_report = saved_service.find_one(
            req=None,
            _id=doc['saved_report']
        )

        if not saved_report.get('is_global'):
            raise SuperdeskApiError.badRequestError(
                'A schedule must be attached to a global saved report'
            )

    @staticmethod
    def _push_notification(doc, operation):
        push_notification(
            'scheduled_reports:update',
            operation=operation,
            schedule_id=str(doc.get('_id'))
        )
