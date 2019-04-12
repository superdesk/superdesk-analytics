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
from .update_time_report import UpdateTimeReportResource, UpdateTimeReportService
from analytics.common import register_report


def init_app(app):
    # Don't register this endpoint if archive stats aren't being generated
    # Generating stats with PUBLISH_ASSOCIATED_ITEMS=True is currently not supported
    if not app.config.get('ANALYTICS_ENABLE_ARCHIVE_STATS', False) or \
            app.config.get('PUBLISH_ASSOCIATED_ITEMS', False):
        return

    endpoint_name = 'update_time_report'
    service = UpdateTimeReportService(endpoint_name, backend=superdesk.get_backend())
    UpdateTimeReportResource(endpoint_name, app=app, service=service)

    register_report(endpoint_name, endpoint_name)

    superdesk.privilege(
        name=endpoint_name,
        label='Analytics - Update Time Report',
        description='User can view Update Time Report'
    )
