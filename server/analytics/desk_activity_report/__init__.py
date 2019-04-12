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
from .desk_activity_report import DeskActivityReportResource, DeskActivityReportService
from analytics.common import register_report


def init_app(app):
    # Don't register this endpoint if archive stats aren't being generated
    if not app.config.get('ANALYTICS_ENABLE_ARCHIVE_STATS', False):
        return

    endpoint_name = 'desk_activity_report'
    service = DeskActivityReportService(endpoint_name, backend=superdesk.get_backend())
    DeskActivityReportResource(endpoint_name, app=app, service=service)

    register_report('desk_activity_report', 'desk_activity_report')

    superdesk.privilege(
        name='desk_activity_report',
        label='Analytics - Desk Activity Reports',
        description='User can view Desk Activity Reports'
    )
