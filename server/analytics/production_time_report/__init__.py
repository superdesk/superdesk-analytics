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
from .production_time_report import (
    ProductionTimeReportResource,
    ProductionTimeReportService,
)
from analytics.common import register_report


def init_app(app):
    # Don't register this endpoint if archive stats aren't being generated
    if not app.config.get("ANALYTICS_ENABLE_ARCHIVE_STATS", False):
        return

    endpoint_name = "production_time_report"
    service = ProductionTimeReportService(
        endpoint_name, backend=superdesk.get_backend()
    )
    ProductionTimeReportResource(endpoint_name, app=app, service=service)

    register_report("production_time_report", "production_time_report")

    superdesk.privilege(
        name="production_time_report",
        label="Analytics - Production Time Reports",
        description="User can view Production Time Reports",
    )
