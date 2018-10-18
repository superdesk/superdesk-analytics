# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import json, get_resource_service
from superdesk.services import BaseService
from superdesk.resource import Resource
from superdesk.notification import push_notification
from superdesk.errors import SuperdeskApiError
from superdesk.users.services import current_user_has_privilege

from apps.auth import get_user_id
from apps.archive.common import get_user, get_auth

from eve.utils import ParsedRequest

from analytics.common import get_report_service


class SavedReportsResource(Resource):
    endpoint_name = resource_title = 'saved_reports'
    schema = {
        'name': {
            'type': 'string',
            'required': True,
            'minlength': 1
        },
        'description': {
            'type': 'string'
        },
        'report': {
            'type': 'string',
            'required': True
        },
        'params': {
            'type': 'dict',
            'required': True
        },
        'user': Resource.rel('users', nullable=True),
        'is_global': {
            'type': 'boolean',
            'default': False
        },
        'translations': {
            'type': 'dict',
            'required': False
        }
    }

    url = 'saved_reports'
    item_methods = ['GET', 'PATCH', 'DELETE']
    resource_methods = ['GET', 'POST']

    privileges = {
        'POST': 'saved_reports',
        'PATCH': 'saved_reports',
        'DELETE': 'saved_reports'
    }


class SavedReportsService(BaseService):
    def on_create(self, docs):
        for doc in docs:
            self._validate_on_create(doc)
            doc['user'] = get_user_id(required=True)
        super().on_create(docs)

    def on_created(self, docs):
        for doc in docs:
            self._push_notification(doc, 'create')

    def on_update(self, updates, original):
        """Runs on update

        Checks if the request owner and the saved search owner are the same person
        If not then the request owner should have global saved reports privilege
        """
        self._validate_on_update(updates, original)
        self._null_updates_from_original(updates, original)
        super().on_update(updates, original)

    def on_updated(self, updates, original):
        self._push_notification(original, 'update')

    def on_delete(self, doc):
        self._validate_on_delete(doc)

    def on_deleted(self, doc):
        self._push_notification(doc, 'delete')

    def get(self, req, lookup):
        """
        Overriding to pass user as search parameter
        """
        session_user = str(get_user_id(required=True))

        if not req:
            req = ParsedRequest()

        where = json.loads(req.where) if req.where else {}

        if lookup:
            where.update(lookup)

        if '$or' not in where:
            where['$or'] = []

        # Restrict the saved reports to either global or owned by current user
        where['$or'].extend([
            {'is_global': True},
            {'user': session_user}
        ])

        req.where = json.dumps(where)

        return super().get(req, lookup=None)

    @staticmethod
    def _push_notification(doc, operation):
        push_notification(
            'savedreports:update',
            report_type=doc['report'],
            operation=operation,
            report_id=str(doc.get('_id')),
            user_id=str(get_user_id()),
            session_id=str(get_auth().get('_id'))
        )

    @staticmethod
    def _validate_on_create(doc):
        """
        User can only create global report if they have 'global_saved_reports' permission
        """
        if doc.get('is_global', False) and not current_user_has_privilege('global_saved_reports'):
            raise SuperdeskApiError.forbiddenError('Unauthorized to create global report.')

    @staticmethod
    def _validate_ownership(doc):
        """
        Validate saved reports on update/delete

        User can only update/delete their own reports, or global reports if they the
        'global_saved_reports' have permission
        """
        session_user = get_user(required=True)
        if str(session_user['_id']) != str(doc.get('user', '')):
            if not doc.get('is_global', False):
                raise SuperdeskApiError.forbiddenError(
                    'Unauthorized to modify other user\'s local report.'
                )
            elif not current_user_has_privilege('global_saved_reports'):
                raise SuperdeskApiError.forbiddenError('Unauthorized to modify global report.')

    def _validate_on_update(self, updates, original):
        self._validate_ownership(original)

        scheduled_service = get_resource_service('scheduled_reports')
        schedules = scheduled_service.get(
            req=None,
            lookup={'saved_report': original['_id']}
        )

        if schedules.count() > 0:
            if original.get('is_global') and not updates.get('is_global'):
                raise SuperdeskApiError.badRequestError(
                    'Cannot remove global flag as schedule(s) are attached'
                )

    def _validate_on_delete(self, doc):
        self._validate_ownership(doc)

        scheduled_service = get_resource_service('scheduled_reports')
        schedules = scheduled_service.get(
            req=None,
            lookup={'saved_report': doc['_id']}
        )

        if schedules.count() > 0:
            raise SuperdeskApiError.badRequestError(
                'Cannot delete saved report as schedule(s) are attached'
            )

    def get_aggregations(self, req, **lookup):
        saved_report = self.find_one(req=req, **lookup)
        if not saved_report:
            raise SuperdeskApiError.notFoundError('Saved report not found')

        report_service = get_report_service(saved_report.get('report'))
        if report_service is None:
            raise SuperdeskApiError.badRequestError('Invalid report type')

        if not getattr(report_service, 'generate_request_from_saved_report'):
            raise SuperdeskApiError.internalError(
                'Cannot generate aggregations from this saved report'
            )

        request = report_service.generate_request_from_saved_report(saved_report)
        aggregations = list(report_service.get(request, lookup=None))[0]

        return saved_report, aggregations

    def _null_updates_from_original(self, updates, original):
        """Null values that are not in the updated report params"""

        self._null_values(updates, original, 'translations')

        if 'params' in updates:
            self._null_values(updates['params'], original['params'], 'must')
            self._null_values(updates['params'], original['params'], 'must_not')
            self._null_values(updates['params'], original['params'], 'chart')
            self._null_values(updates['params'], original['params'], 'dates')
            self._null_values(updates['params'], original['params'], 'aggs')
            self._null_values(updates['params'], original['params'], 'repos')

    def _null_values(self, updates, original, field):
        """Sets values to None that are in original but not in updates"""

        if field not in updates:
            return

        for key in (original or {}).get(field) or {}:
            if key not in updates[field]:
                updates[field][key] = None
