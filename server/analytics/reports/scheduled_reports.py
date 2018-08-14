# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.services import BaseService
from superdesk.resource import Resource
from superdesk.notification import push_notification

from analytics.common import mime_types, MIME_TYPES

from collections import namedtuple

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
            self._push_notification(doc, 'create')

    def on_updated(self, updates, original):
        self._push_notification(original, 'update')

    def on_deleted(self, doc):
        self._push_notification(doc, 'delete')

    @staticmethod
    def _push_notification(doc, operation):
        push_notification(
            'scheduled_reports:update',
            operation=operation,
            schedule_id=str(doc.get('_id'))
        )
