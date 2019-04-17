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
from .featuremedia_updates_report import FeaturemdiaUpdatesReportResource,\
    FeaturemediaUpdatesTimeReportService
from analytics.common import register_report


def init_app(app):
    # Don't register this endpoint if archive stats aren't being generated
    # Generating stats with PUBLISH_ASSOCIATED_ITEMS=True is currently not supported
    if not app.config.get('ANALYTICS_ENABLE_ARCHIVE_STATS', False) or \
            app.config.get('PUBLISH_ASSOCIATED_ITEMS', False):
        return

    endpoint_name = 'featuremedia_updates_report'
    service = FeaturemediaUpdatesTimeReportService(endpoint_name, backend=superdesk.get_backend())
    FeaturemdiaUpdatesReportResource(endpoint_name, app=app, service=service)

    register_report('featuremedia_updates_report', 'featuremedia_updates_report')

    superdesk.privilege(
        name='featuremedia_updates_report',
        label='Analytics - Featuremdia Updates Report',
        description='User can view Featuremdia Updates Report'
    )
