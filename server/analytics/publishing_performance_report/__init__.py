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
from .publishing_performance_report import PublishingPerformanceReportResource, \
    PublishingPerformanceReportService

from analytics.common import register_report


def init_app(app):
    endpoint_name = 'publishing_performance_report'
    service = PublishingPerformanceReportService(endpoint_name, backend=superdesk.get_backend())
    PublishingPerformanceReportResource(endpoint_name, app=app, service=service)
    register_report('publishing_performance_report', 'publishing_performance_report')

    superdesk.privilege(
        name='publishing_performance_report',
        label='Analytics - Publishing Performance Reports',
        description='User can view Publishing Performance Reports'
    )
