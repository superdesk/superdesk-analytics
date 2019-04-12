# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from .planning_usage_report import PlanningUsageReportResource, PlanningUsageReportService
from analytics.common import register_report


def init_app(app):
    # Don't register this endpoint if the Planning module is not configured
    if 'planning' not in app.settings['INSTALLED_APPS']:
        return

    endpoint_name = 'planning_usage_report'
    service = PlanningUsageReportService(endpoint_name, backend=superdesk.get_backend())
    PlanningUsageReportResource(endpoint_name, app=app, service=service)
    register_report('planning_usage_report', 'planning_usage_report')

    superdesk.privilege(
        name='planning_usage_report',
        label='Analytics - Planning Usage Reports',
        description='User can view Planning Usage Reports'
    )
