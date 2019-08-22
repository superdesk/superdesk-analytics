# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import Command, command, Option, get_resource_service
from superdesk.logging import logger
from superdesk.errors import SuperdeskApiError
from superdesk.utc import utc_to_local, utcnow, local_to_utc

from flask import current_app as app
from datetime import datetime


class SendScheduledReports(Command):
    """
    Send scheduled reports

    Example:
    ::

        $ python manage.py analytics:send_scheduled_reports
        $ python manage.py analytics:send_scheduled_reports --now

    """

    option_list = [
        Option(
            '--now', '-n',
            dest='now',
            required=False,
            help="Local date/hour in the format '%Y-%m-%dT%H', i.e. 2018-09-13T10"
        )
    ]

    def run(self, now=None):
        if now:
            now_utc = now if isinstance(now, datetime) else local_to_utc(
                app.config['DEFAULT_TIMEZONE'],
                datetime.strptime(now, '%Y-%m-%dT%H')
            )
        else:
            now_utc = utcnow()

        now_local = utc_to_local(app.config['DEFAULT_TIMEZONE'], now_utc)

        logger.info('Starting to send scheduled reports: {}'.format(now_utc))

        schedules = self.get_schedules()

        if len(schedules) < 1:
            logger.info('No enabled schedules found, not continuing')
            return

        # Set now to the beginning of the hour (in local time)
        now_local = now_local.replace(minute=0, second=0, microsecond=0)

        for scheduled_report in schedules:
            schedule_id = str(scheduled_report.get('_id'))

            try:
                if not self.should_send_report(scheduled_report, now_local):
                    logger.info('Scheduled Report {} not scheduled to be sent'.format(schedule_id))
                    continue

                logger.info('Attempting to send Scheduled Report {}'.format(schedule_id))
                self._send_report(scheduled_report)

                # Update the _last_sent of the schedule
                get_resource_service('scheduled_reports').system_update(
                    scheduled_report.get('_id'),
                    {'_last_sent': now_utc},
                    scheduled_report
                )
            except Exception as e:
                logger.error('Failed to generate report for {}. Error: {}'.format(
                    schedule_id,
                    str(e)
                ))
                logger.exception(e)

        logger.info('Completed sending scheduled reports: {}'.format(now_utc))

    @staticmethod
    def get_schedules():
        return list(
            get_resource_service('scheduled_reports').get(
                req=None,
                lookup={'active': {'$eq': True}}
            )
        )

    @staticmethod
    def should_send_report(scheduled_report, now_local):
        # Set now to the beginning of the hour (in local time)
        now_to_hour = now_local.replace(minute=0, second=0, microsecond=0)

        last_sent = None
        if scheduled_report.get('_last_sent'):
            last_sent = utc_to_local(
                app.config['DEFAULT_TIMEZONE'],
                scheduled_report.get('_last_sent')
            ).replace(
                minute=0,
                second=0,
                microsecond=0
            )

        # Fix issue with incorrect schedule attributes being stored
        get_resource_service('scheduled_reports').set_schedule(scheduled_report)
        schedule = scheduled_report.get('schedule') or {}
        schedule_hour = schedule.get('hour', -1)
        schedule_day = schedule.get('day', -1)
        schedule_week_days = schedule.get('week_days') or []

        # Is this report to be run today (Day of the month)?
        # -1 = every day
        if schedule_day > -1 and schedule_day != now_to_hour.day:
            return False

        # Is this report to be run on this week day (i.e. Monday, Wednesday etc)?
        # None or [] = every week day
        week_day = now_to_hour.strftime('%A')
        if len(schedule_week_days) > 0 and week_day not in schedule_week_days:
            return False

        # Is this report to be run on this hour (i.e. 8am)
        # -1 = every hour
        if schedule_hour > -1 and schedule_hour != now_to_hour.hour:
            return False

        # This report has not been run on this hour
        if last_sent is not None and now_to_hour <= last_sent:
            return False

        return True

    @staticmethod
    def _send_report(scheduled_report):
        email_service = get_resource_service('email_report')
        saved_report = get_resource_service('saved_reports').find_one(
            req=None,
            _id=scheduled_report.get('saved_report')
        )

        if not saved_report:
            raise SuperdeskApiError.notFoundError('Saved report not found')

        extra = scheduled_report.get('extra') or {}
        body = extra.get('body') or 'Superdesk Analytics - {}'.format(
            scheduled_report.get('name')
        )

        email_service.post([{
            'report': {
                'type': saved_report.get('report'),
                'params': saved_report.get('params'),
                'mimetype': scheduled_report.get('mimetype'),
                'width': scheduled_report.get('report_width')
            },
            'email': {
                'recipients': scheduled_report.get('recipients'),
                'subject': 'Superdesk Analytics - {}'.format(scheduled_report.get('name')),
                'txt': {'body': body},
                'html': {'body': body}
            }
        }])


command('analytics:send_scheduled_reports', SendScheduledReports())
