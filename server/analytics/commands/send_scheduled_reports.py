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
from superdesk.celery_app import celery
from superdesk.lock import lock, unlock
from superdesk.utc import utc_to_local, utcnow

from analytics.common import get_report_service, MIME_TYPES, get_mime_type_extension
from analytics.reports import generate_report

from flask import current_app as app


@celery.task(bind=True, max_retries=3, soft_time_limit=120)
def send_email_report(
        self,
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
                msg.attach(
                    attachment.get('filename'),
                    attachment.get('mimetype'),
                    attachment.get('file')
                )

        return app.mail.send(msg)
    finally:
        unlock(lock_id, remove=True)


class SendScheduledReports(Command):
    option_list = [
        Option('--now', '-n', dest='now', required=False)
    ]

    def run(self, now=None):
        schedules = self.get_schedules()

        now_utc = now or utcnow()
        now_local = utc_to_local(app.config['DEFAULT_TIMEZONE'], now_utc)

        logger.info('Starting to send scheduled reports: {}'.format(now_utc))

        # Set now to the beginning of the hour (in local time)
        now_local = now_local.replace(minute=0, second=0, microsecond=0)

        for scheduled_report in schedules:
            if not self.should_send_report(scheduled_report, now_local):
                continue

            attachments = self.get_attachments(scheduled_report)
            self.send_report(scheduled_report, attachments)

            # Update the _last_sent of the schedule
            get_resource_service('scheduled_reports').system_update(
                scheduled_report.get('_id'),
                {'_last_sent': now_utc},
                scheduled_report
            )

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

        schedule = scheduled_report.get('schedule') or {}
        week_day = now_to_hour.strftime('%A')

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

        schedule_hour = schedule.get('hour', -1)
        schedule_day = schedule.get('day', -1)
        schedule_week_days = schedule.get('week_days') or []

        # Is this report to be run today (Day of the month)?
        # -1 = every day
        if schedule_day > -1 and schedule_day != now_to_hour.day:
            return False

        # Is this report to be run on this week day (i.e. Monday, Wednesday etc)?
        # None or [] = every week day
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

        mime_type = scheduled_report.get('mimetype')

        i = 1
        for option in options:
            attachments.append({
                'file': generate_report(
                    option,
                    mimetype=mime_type,
                    base64=True,
                    width=scheduled_report.get('report_width')
                ),
                'mimetype': mime_type,
                'filename': 'chart_{}.{}'.format(i, get_mime_type_extension(mime_type))
            })
            i += 1

        return attachments

    def send_report(self, scheduled_report, attachments):
        if scheduled_report.get('transmitter') == 'email':
            sender = app.config['ADMINS'][0]

            extra = scheduled_report.get('extra') or {}

            send_email_report.delay(
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
