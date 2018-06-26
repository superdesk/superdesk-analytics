# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2016 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk

from analytics.activity_report import ActivityReportResource, ActivityReportService
from analytics.saved_activity_reports import SavedActivityReportResource, \
    SavedActivityReportService
from analytics.track_activity import TrackActivityResource, TrackActivityService
from analytics.processed_items_report import ProcessedItemsResource, ProcessedItemsService
from analytics.content_quota_reports import ContentQuotaReportResource, ContentQuotaReportService
from analytics.source_category_report import SourceCategoryReportResource, SourceCategoryReportService


def init_app(app):
    endpoint_name = 'activity_report'
    service = ActivityReportService(endpoint_name, backend=superdesk.get_backend())
    ActivityReportResource(endpoint_name, app=app, service=service)

    endpoint_name = 'saved_activity_reports'
    service = SavedActivityReportService(endpoint_name, backend=superdesk.get_backend())
    SavedActivityReportResource(endpoint_name, app=app, service=service)

    endpoint_name = 'track_activity_report'
    service = TrackActivityService(endpoint_name, backend=superdesk.get_backend())
    TrackActivityResource(endpoint_name, app=app, service=service)

    endpoint_name = 'processed_items_report'
    service = ProcessedItemsService(endpoint_name, backend=superdesk.get_backend())
    ProcessedItemsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'content_quota_report'
    service = ContentQuotaReportService(endpoint_name, backend=superdesk.get_backend())
    ContentQuotaReportResource(endpoint_name, app=app, service=service)

    endpoint_name = 'source_category_report'
    service = SourceCategoryReportService(endpoint_name, backend=superdesk.get_backend())
    SourceCategoryReportResource(endpoint_name, app=app, service=service)

    superdesk.privilege(name='activity_report', label='Activity Report View',
                        description='User can view activity reports.')
    superdesk.privilege(name='track_activity_report', label='Track Activity Report View')
    superdesk.privilege(name='processed_items_report', label='Processed Items Report View',
                        description='User can view activity reports.')
    superdesk.privilege(name='content_quota_report', label='Content Quota Report View',
                        description='User can view content v quota reports.')
    superdesk.privilege(
        name='source_category_report',
        label='Source Category Report View',
        description='User can view source v category reports.'
    )
