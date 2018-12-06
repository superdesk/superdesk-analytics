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
from analytics.base_report import BaseReportService
from analytics.saved_reports import SavedReportsResource, SavedReportsService
from analytics.reports.scheduled_reports import ScheduledReportsResource, ScheduledReportsService
from analytics.content_publishing_report import init_app as init_content_publishing_report
from analytics.publishing_performance_report import init_app as init_publishing_performance_report
from analytics.email_report import init_app as init_email_report
from analytics.planning_usage_report import init_app as init_planning_usage_report
from analytics.stats import init_app as init_stats

from analytics.commands import SendScheduledReports  # noqa
from analytics.common import is_highcharts_installed, register_report
from superdesk.celery_app import celery
from superdesk.default_settings import celery_queue, crontab


def init_schedule_task(app):
    # Now check the application config to see if scheduled reports is enabled
    if not app.config.get('ANALYTICS_ENABLE_SCHEDULED_REPORTS', False):
        return

    # First check to see if highcharts-export-server is installed and globally accessible
    if not is_highcharts_installed():
        superdesk.logger.warn('Highcharts export server is not installed')
        return

    # Make sure the TASK_ROUTES are set
    if not app.config['CELERY_TASK_ROUTES']:
        app.config['CELERY_TASK_ROUTES'] = {}

    # If the celery task is not configured, then set the default now
    if not app.config['CELERY_TASK_ROUTES'].get('analytics.send_scheduled_reports'):
        app.config['CELERY_TASK_ROUTES']['analytics.send_scheduled_reports'] = {
            'queue': celery_queue('default'),
            'routing_key': 'analytics.schedules'
        }

    # Make sure the BEAT_SCHEDULE are set
    if not app.config['CELERY_BEAT_SCHEDULE']:
        app.config['CELERY_BEAT_SCHEDULE'] = {}

    # If the celery schedule is not configured, then set the default now
    if not app.config['CELERY_BEAT_SCHEDULE'].get('analytics:send_scheduled_reports'):
        app.config['CELERY_BEAT_SCHEDULE']['analytics:send_scheduled_reports'] = {
            'task': 'analytics.send_scheduled_reports',
            'schedule': crontab(minute='0')  # Runs once every hour
        }


def init_app(app):
    endpoint_name = 'activity_report'
    service = ActivityReportService(endpoint_name, backend=superdesk.get_backend())
    ActivityReportResource(endpoint_name, app=app, service=service)
    register_report('activity_report', 'activity_report')

    endpoint_name = 'saved_activity_reports'
    service = SavedActivityReportService(endpoint_name, backend=superdesk.get_backend())
    SavedActivityReportResource(endpoint_name, app=app, service=service)

    endpoint_name = 'track_activity_report'
    service = TrackActivityService(endpoint_name, backend=superdesk.get_backend())
    TrackActivityResource(endpoint_name, app=app, service=service)
    register_report('track_activity_report', 'track_activity_report')

    endpoint_name = 'processed_items_report'
    service = ProcessedItemsService(endpoint_name, backend=superdesk.get_backend())
    ProcessedItemsResource(endpoint_name, app=app, service=service)
    register_report('processed_items_report', 'processed_items_report')

    endpoint_name = 'content_quota_report'
    service = ContentQuotaReportService(endpoint_name, backend=superdesk.get_backend())
    ContentQuotaReportResource(endpoint_name, app=app, service=service)
    register_report('content_quota_report', 'content_quota_report')

    endpoint_name = 'source_category_report'
    service = SourceCategoryReportService(endpoint_name, backend=superdesk.get_backend())
    SourceCategoryReportResource(endpoint_name, app=app, service=service)
    register_report('source_category_report', 'source_category_report')

    endpoint_name = 'scheduled_reports'
    service = ScheduledReportsService(endpoint_name, backend=superdesk.get_backend())
    ScheduledReportsResource(endpoint_name, app=app, service=service)

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

    endpoint_name = SavedReportsResource.endpoint_name
    service = SavedReportsService(endpoint_name, backend=superdesk.get_backend())
    SavedReportsResource(endpoint_name, app=app, service=service)
    superdesk.privilege(
        name='global_saved_reports',
        label='Manage Global Saved Reports',
        description='User can manage other uses\' global saved reports'
    )
    superdesk.privilege(
        name='saved_reports',
        label='Manage Saved Reports',
        description='User can manage saved reports'
    )
    superdesk.privilege(
        name='scheduled_reports',
        label='Manage Scheduling Reports',
        description='User can manage scheduling of reports'
    )

    init_content_publishing_report(app)
    init_publishing_performance_report(app)
    init_email_report(app)
    init_planning_usage_report(app)
    init_stats(app)

    # If this app is for testing, then create an endpoint for the base reporting service
    # so the core searching/aggregation functionality can be tested
    if app.testing:
        class TestReportService(BaseReportService):
            aggregations = {
                'category': {'terms': {'field': 'anpa_category.qcode', 'size': 0}},
                'source': {'terms': {'field': 'source', 'size': 0}}
            }

        class BaseReportResource(superdesk.resource.Resource):
            item_methods = ['GET']
            resource_methods = ['GET']

        endpoint_name = 'analytics_test_report'
        service = TestReportService(endpoint_name, backend=superdesk.get_backend())
        BaseReportResource(endpoint_name, app=app, service=service)

    init_schedule_task(app)


@celery.task(soft_time_limit=600)
def send_scheduled_reports():
    SendScheduledReports().run()
