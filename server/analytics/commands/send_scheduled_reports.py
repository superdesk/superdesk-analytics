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
from superdesk.emails import SuperdeskMessage
from superdesk.lock import lock, unlock
from superdesk.utc import utc_to_local, utcnow, local_to_utc

from analytics.common import get_report_service, MIME_TYPES, get_mime_type_extension
from analytics.reports import generate_report

from flask import current_app as app
from datetime import datetime


# Send the email synchronously as celery/kmobo failed to pass binary attachments
# TODO: Serialise attachments so celery can be used with sending emails
def send_email_report(
        _id,
        subject,
        sender,
        recipients,
        text_body,
        html_body,
        cc=None,
        bcc=None,
        attachments=None
):
    lock_id = 'analytics_email:%s'.format(str(_id))
    if not lock(lock_id, expire=120):
        return

    try:
        msg = SuperdeskMessage(
            subject,
            sender=sender,
            recipients=recipients,
            cc=cc,
            bcc=bcc,
            body=text_body,
            html=html_body
        )

        if attachments is not None:
            for attachment in attachments:
                if attachment.get('mimetype') == MIME_TYPES.HTML:
                    msg.html += attachment.get('file')
                else:
                    msg.attach(
                        attachment.get('filename'),
                        attachment.get('mimetype'),
                        attachment.get('file')
                    )

        return app.mail.send(msg)
    except Exception as e:
        logger.error('Failed to send report email. Error: {}'.format(str(e)))
    finally:
        unlock(lock_id, remove=True)


class SendScheduledReports(Command):
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
                attachments = self.get_attachments(scheduled_report)
                self.send_report(scheduled_report, attachments)

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

        logger.info('Completed sending scheduled reports: {}'.format(now_utc))

    def get_schedules(self):
        return list(
            get_resource_service('scheduled_reports').get(
                req=None,
                lookup={'active': {'$eq': True}}
            )
        )

    def should_send_report(self, scheduled_report, now_local):
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

    def get_attachments(self, scheduled_report):
        saved_report = get_resource_service('saved_reports').find_one(
            req=None,
            _id=scheduled_report.get('saved_report')
        )

        if not saved_report:
            raise SuperdeskApiError.notFoundError('Saved report not found')

        report_service = get_report_service(saved_report.get('report'))
        if report_service is None:
            raise SuperdeskApiError.badRequestError('Invalid report type')

        if scheduled_report.get('mimetype') in [
            MIME_TYPES.PNG,
            MIME_TYPES.JPEG,
            MIME_TYPES.GIF,
            MIME_TYPES.PDF,
            MIME_TYPES.SVG
        ]:
            # This mimetype is handled by highcharts, so generate the highcharts config
            return_type = 'highcharts_config'
        elif scheduled_report.get('mimetype') == MIME_TYPES.CSV:
            return_type = MIME_TYPES.CSV
        else:
            # Highcharts is not used, therefor no need to generate highcharts config
            return_type = 'aggregations'

        generated_report = list(report_service.get(
            req=None,
            params=saved_report.get('params'),
            return_type=return_type
        ))[0]

        if return_type == 'highcharts_config':
            options = generated_report.get('highcharts')
        elif return_type == MIME_TYPES.CSV:
            options = [generated_report.get('csv')]
        else:
            options = []

        attachments = []

        i = 1
        for option in options:
            mime_type = scheduled_report.get('mimetype')

            if isinstance(option, dict) and option.get('type') == 'table':
                mime_type = MIME_TYPES.HTML

            try:
                attachments.append({
                    'file': generate_report(
                        option,
                        mimetype=mime_type,
                        base64=False,
                        width=scheduled_report.get('report_width')
                    ),
                    'mimetype': mime_type,
                    'filename': 'chart_{}.{}'.format(i, get_mime_type_extension(mime_type))
                })
                i += 1
            except Exception as e:
                logger.error('Failed to generate chart for {}. Error: {}'.format(
                    str(scheduled_report.get('_id')),
                    str(e)
                ))

        return attachments

    def send_report(self, scheduled_report, attachments):
        if scheduled_report.get('transmitter') == 'email':
            sender = app.config['ADMINS'][0]

            extra = scheduled_report.get('extra') or {}

            send_email_report(
                _id=scheduled_report.get('_id'),
                subject='Superdesk Analytics - {}'.format(scheduled_report.get('name')),
                sender=sender,
                recipients=scheduled_report.get('recipients'),
                text_body=extra.get('body') or 'Superdesk Analytics - {}'.format(
                    scheduled_report.get('name')),
                html_body=extra.get('body') or 'Superdesk Analytics - {}'.format(
                    scheduled_report.get('name')),
                attachments=attachments
            )


command('analytics:send_scheduled_reports', SendScheduledReports())
