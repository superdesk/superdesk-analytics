# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service, resources
from superdesk.tests import TestCase

from analytics.planning_usage_report import init_app


class PlanningUsageReportTestCase(TestCase):
    def test_get_users_with_planning(self):
        with self.app.app_context():
            # Remove the 'Planning' app and 'planning_usage_report' endpoint if they are already configured
            try:
                self.app.settings['INSTALLED_APPS'].remove('planning')
                resources.pop('planning_usage_report', None)
            except ValueError:
                pass

            # Test PlanningUsage not registering if 'Planning' module is not configured
            init_app(self.app)
            self.assertRaises(KeyError, get_resource_service, 'planning_usage_report')

            # Test PlanningUsage registering when 'Planning' module is configured
            self.app.settings['INSTALLED_APPS'].append('planning')
            init_app(self.app)
            service = get_resource_service('planning_usage_report')

        self.app.data.insert('roles', [{
            '_id': 'role1',
            'privileges': {'planning': 0}
        }, {
            '_id': 'role2',
            'privileges': {'planning': 1}
        }])

        self.app.data.insert('users', [{
            '_id': 'user1',
            'privileges': {'planning': 0},
            'is_active': True,
            'is_enabled': True
        }, {
            '_id': 'user2',
            'privileges': {'planning': 1},
            'is_active': True,
            'is_enabled': True
        }, {
            '_id': 'user3',
            'privileges': {},
            'role': 'role1',
            'is_active': True,
            'is_enabled': True
        }, {
            '_id': 'user4',
            'privileges': {},
            'role': 'role2',
            'is_active': True,
            'is_enabled': True
        }])

        users = service._get_users_with_planning()

        self.assertEqual(users, ['user2', 'user4'])
