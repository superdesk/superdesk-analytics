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

from analytics.report_configs import ReportConfigsResource, ReportConfigsService
from analytics.base_report import BaseReportService
from analytics.saved_reports import SavedReportsResource, SavedReportsService
from analytics.reports.scheduled_reports import ScheduledReportsResource, ScheduledReportsService
from analytics.content_publishing_report import init_app as init_content_publishing_report
from analytics.publishing_performance_report import init_app as init_publishing_performance_report
from analytics.email_report import init_app as init_email_report
from analytics.planning_usage_report import init_app as init_planning_usage_report
from analytics.stats import init_app as init_stats
from analytics.desk_activity_report import init_app as init_desk_activity_report
from analytics.production_time_report import init_app as init_production_time_report
from analytics.user_activity_report import init_app as init_user_acitivity_report
from analytics.featuremedia_updates_report import init_app as init_featuremedia_updates_report
from analytics.update_time_report import init_app as init_update_time_report

from analytics.commands import SendScheduledReports  # noqa
from analytics.common import is_highcharts_installed, register_report
from superdesk.celery_app import celery
from superdesk.default_settings import celery_queue, crontab

__version__ = '1.33.3'


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
    endpoint_name = 'scheduled_reports'
    service = ScheduledReportsService(endpoint_name, backend=superdesk.get_backend())
    ScheduledReportsResource(endpoint_name, app=app, service=service)

    endpoint_name = SavedReportsResource.endpoint_name
    service = SavedReportsService(endpoint_name, backend=superdesk.get_backend())
    SavedReportsResource(endpoint_name, app=app, service=service)

    superdesk.privilege(
        name='global_saved_reports',
        label='Analytics - Manage Global Saved Reports',
        description='User can manage other uses\' global saved reports'
    )
    superdesk.privilege(
        name='saved_reports',
        label='Analytics - Manage Saved Reports',
        description='User can manage saved reports'
    )
    superdesk.privilege(
        name='scheduled_reports',
        label='Analytics - Manage Scheduling Reports',
        description='User can manage scheduling of reports'
    )

    endpoint_name = ReportConfigsResource.endpoint_name
    service = ReportConfigsService(endpoint_name, backend=superdesk.get_backend())
    ReportConfigsResource(endpoint_name, app=app, service=service)

    init_content_publishing_report(app)
    init_publishing_performance_report(app)
    init_email_report(app)
    init_planning_usage_report(app)
    init_stats(app)
    init_desk_activity_report(app)
    init_production_time_report(app)
    init_user_acitivity_report(app)
    init_featuremedia_updates_report(app)
    init_update_time_report(app)

    app.client_config.setdefault('highcharts', {})
    app.client_config['highcharts']['license'] = {
        'id': app.config.get('HIGHCHARTS_LICENSE_ID') or '',
        'type': app.config.get('HIGHCHARTS_LICENSE_TYPE') or 'OEM',
        'licensee': app.config.get('HIGHCHARTS_LICENSEE') or '',
        'contact': app.config.get('HIGHCHARTS_LICENSEE_CONTACT') or '',
        'customer_id': app.config.get('HIGHCHARTS_LICENSE_CUSTOMER_ID') or '',
        'expiry': app.config.get('HIGHCHARTS_LICENSE_EXPIRY') or ''
    }

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
