# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk import get_resource_service
from superdesk.utc import local_to_utc

from analytics.tests import TestCase
from analytics.commands.send_scheduled_reports import SendScheduledReports
from analytics.common import MIME_TYPES
from analytics.email_report.email_report import EmailReportService

from datetime import datetime
from flask import current_app as app
from dateutil.rrule import rrule, HOURLY
import pytz
from unittest import mock
from os import urandom
from base64 import b64encode, b64decode


def to_naive(date_str):
    return datetime.strptime(date_str, '%Y-%m-%dT%H')


def to_utc(date_str):
    return local_to_utc(
        app.config['DEFAULT_TIMEZONE'],
        datetime.strptime(date_str, '%Y-%m-%dT%H')
    )


def to_local(date_str):
    local_tz = pytz.timezone(app.config['DEFAULT_TIMEZONE'])
    local_datetime = datetime.strptime(date_str, '%Y-%m-%dT%H')

    return local_tz.localize(local_datetime)


mock_file = b64encode(bytearray(urandom(123)))
mock_csv = b64encode('Source,Domestic Sport,Finance\r\nAAP,2,3\r\nAP,5,10\r\n'.encode('UTF-8'))
mock_array = [{
    'file': b64encode(bytearray(urandom(456))),
    'mimetype': MIME_TYPES.PNG,
    'filename': 'chart_1.png'
}, {
    'file': b64encode(bytearray(urandom(789))),
    'mimetype': MIME_TYPES.PNG,
    'filename': 'chart_2.png'
}]
mock_users = [{'_id': 'user1'}]
mock_vocabs = [{
    '_id': 'categories',
    'items': [
        {'is_active': True, 'name': 'Domestic Sport', 'qcode': 's'},
        {'is_active': True, 'name': 'Finance', 'qcode': 'f'}
    ]
}]
mock_saved_reports = [{
    '_id': 'srep1',
    'name': 'Saved Report',
    'report': 'content_publishing_report',
    'params': {
        'dates': {
            'filter': 'range',
            'start': '2018-06-01',
            'end': '2018-06-30'
        },
        'aggs': {
            'group': {
                'field': 'source',
                'size': 0
            },
            'subgroup': {
                'field': 'anpa_category.qcode',
                'size': 0
            }
        }
    },
    'user': 'user1'
}]


class SendScheduleReportTestCase(TestCase):
    def setUp(self):
        super().setUp()
        self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
        self.app.config['ADMINS'] = ['superdesk@test.com']
        self.should_send = SendScheduledReports().should_send_report

    def _test(self, report, start, end, expected_hits):
        count = 0
        for now in rrule(HOURLY, dtstart=to_naive(start), until=to_naive(end)):
            local_tz = pytz.timezone(app.config['DEFAULT_TIMEZONE'])
            now_local = local_tz.localize(now)

            response = self.should_send(report, now_local)

            self.assertEqual(
                response,
                now_local in expected_hits,
                '{} not in {}'.format(now_local, [str(d) for d in expected_hits])
            )

            if response:
                # Update the last sent time to now
                report['_last_sent'] = local_to_utc(app.config['DEFAULT_TIMEZONE'], now_local)
                count += 1

        self.assertEqual(len(expected_hits), count)

    @mock.patch(
        'analytics.email_report.email_report.generate_report',
        return_value=mock_file
    )
    def test_run_hourly_png(self, mocked):
        with self.app.app_context():
            self.app.data.insert('users', mock_users)
            self.app.data.insert('vocabularies', mock_vocabs)
            self.app.data.insert('saved_reports', mock_saved_reports)
            self.app.data.insert('scheduled_reports', [{
                '_id': 'sched1',
                'name': 'Scheduled Report',
                'saved_report': 'srep1',
                'schedule': {'frequency': 'hourly'},
                'transmitter': 'email',
                'mimetype': MIME_TYPES.PNG,
                'extra': {'body': 'This is a test email'},
                'recipients': ['superdesk@localhost.com'],
                'report_width': 1200,
                'active': True
            }])

            scheduled_service = get_resource_service('scheduled_reports')

            report = scheduled_service.find_one(req=None, _id='sched1')
            self.assertNotIn('_last_sent', report)

            # Simulate running every hour for a few hours
            start_date = to_naive('2018-06-30T00')
            end_date = to_naive('2018-06-30T03')
            local_tz = pytz.timezone(app.config['DEFAULT_TIMEZONE'])
            with self.app.mail.record_messages() as outbox:
                for now in rrule(HOURLY, dtstart=start_date, until=end_date):
                    now_local = local_tz.localize(now)
                    now_utc = local_to_utc(app.config['DEFAULT_TIMEZONE'], now_local)

                    SendScheduledReports().run(now_utc)

                    # _last sent is updated
                    report = scheduled_service.find_one(req=None, _id='sched1')
                    self.assertEqual(report.get('_last_sent'), now_utc)

                # Test that the command sent emails across the 4 iterations
                self.assertEqual(len(outbox), 4)

                # Test the first email
                self.assertEqual(outbox[0].sender, 'superdesk@test.com')
                self.assertEqual(outbox[0].subject, 'Superdesk Analytics - Scheduled Report')
                self.assertTrue(outbox[0].body.startswith('\nThis is a test email'))
                self.assertTrue('This is a test email' in outbox[0].html)
                self.assertTrue('<img src="cid:' in outbox[0].html)

                self.assertEqual(outbox[0].recipients, ['superdesk@localhost.com'])

                # Test attachment
                self.assertEqual(len(outbox[0].attachments), 1)
                self.assertEqual(outbox[0].attachments[0].data, b64decode(mock_file))
                self.assertEqual(
                    outbox[0].attachments[0].content_type,
                    '{}; name="chart_1.png"'.format(MIME_TYPES.PNG)
                )
                self.assertEqual(outbox[0].attachments[0].filename, 'chart_1.png')

            report = scheduled_service.find_one(req=None, _id='sched1')
            self.assertEqual(report.get('_last_sent'), to_utc('2018-06-30T03'))

    @mock.patch(
        'analytics.email_report.email_report.generate_report',
        return_value=mock_file
    )
    def test_run_daily_jpeg(self, mocked):
        with self.app.app_context():
            self.app.data.insert('users', mock_users)
            self.app.data.insert('vocabularies', mock_vocabs)
            self.app.data.insert('saved_reports', mock_saved_reports)
            self.app.data.insert('scheduled_reports', [{
                '_id': 'sched1',
                'name': 'Scheduled Report',
                'saved_report': 'srep1',
                'schedule': {
                    'frequency': 'daily',
                    'hour': 1
                },
                'transmitter': 'email',
                'mimetype': MIME_TYPES.JPEG,
                'extra': {'body': 'This is a test email'},
                'recipients': ['superdesk@localhost.com'],
                'report_width': 1200,
                'active': True
            }])

            scheduled_service = get_resource_service('scheduled_reports')

            report = scheduled_service.find_one(req=None, _id='sched1')
            self.assertNotIn('_last_sent', report)

            # Simulate running every hour for a few hours
            start_date = to_naive('2018-06-30T00')
            end_date = to_naive('2018-06-30T03')
            should_have_updated = False
            with self.app.mail.record_messages() as outbox:
                for now in rrule(HOURLY, dtstart=start_date, until=end_date):
                    local_tz = pytz.timezone(app.config['DEFAULT_TIMEZONE'])
                    now_local = local_tz.localize(now)
                    now_utc = local_to_utc(app.config['DEFAULT_TIMEZONE'], now_local)

                    SendScheduledReports().run(now_utc)

                    # _last sent is updated
                    report = scheduled_service.find_one(req=None, _id='sched1')

                    if not should_have_updated:
                        should_have_updated = True
                        self.assertNotIn('_last_sent', report)
                    else:
                        self.assertEqual(report.get('_last_sent'), to_utc('2018-06-30T01'))

                # Test that the command sent only 1 email
                self.assertEqual(len(outbox), 1)

                # Test attachment
                self.assertEqual(len(outbox[0].attachments), 1)
                self.assertEqual(
                    outbox[0].attachments[0].content_type,
                    '{}; name="chart_1.jpeg"'.format(MIME_TYPES.JPEG)
                )
                self.assertEqual(outbox[0].attachments[0].filename, 'chart_1.jpeg')

            report = scheduled_service.find_one(req=None, _id='sched1')
            self.assertEqual(report.get('_last_sent'), to_utc('2018-06-30T01'))

    @mock.patch(
        'analytics.email_report.email_report.generate_report',
        return_value=mock_csv
    )
    def test_email_csv(self, mocked):
        with self.app.app_context():
            self.app.data.insert('users', mock_users)
            self.app.data.insert('vocabularies', mock_vocabs)
            self.app.data.insert('saved_reports', mock_saved_reports)
            self.app.data.insert('scheduled_reports', [{
                '_id': 'sched1',
                'name': 'Scheduled Report',
                'saved_report': 'srep1',
                'schedule': {'frequency': 'hourly'},
                'transmitter': 'email',
                'mimetype': MIME_TYPES.CSV,
                'extra': {'body': 'This is a test email'},
                'recipients': ['superdesk@localhost.com'],
                'active': True
            }])

            with self.app.mail.record_messages() as outbox:
                SendScheduledReports().run('2018-06-30T00')

                self.assertEqual(len(outbox), 1)

                # Test attachment
                self.assertEqual(len(outbox[0].attachments), 1)
                self.assertEqual(
                    outbox[0].attachments[0].content_type,
                    '{}; name="chart_1.csv"'.format(MIME_TYPES.CSV)
                )
                self.assertEqual(outbox[0].attachments[0].filename, 'chart_1.csv')
                self.assertEqual(outbox[0].attachments[0].data, b64decode(mock_csv))

    @mock.patch.object(
        EmailReportService,
        '_gen_attachments',
        return_value=mock_array
    )
    def test_email_multiple_attachments(self, mock):
        with self.app.app_context():
            self.app.data.insert('users', mock_users)
            self.app.data.insert('vocabularies', mock_vocabs)
            self.app.data.insert('saved_reports', [{
                '_id': 'srep1',
                'name': 'Saved Report',
                'report': 'content_publishing_report',
                'params': {
                    'dates': {
                        'filter': 'range',
                        'start': '2018-06-01',
                        'end': '2018-06-30',
                    },
                    'chart_type': 'pie'
                },
                'user': 'user1'
            }])
            self.app.data.insert('scheduled_reports', [{
                '_id': 'sched1',
                'name': 'Scheduled Report',
                'saved_report': 'srep1',
                'schedule': {'frequency': 'hourly'},
                'transmitter': 'email',
                'mimetype': MIME_TYPES.PNG,
                'extra': {'body': 'This is a test email'},
                'recipients': ['superdesk@localhost.com'],
                'active': True
            }])

            with self.app.mail.record_messages() as outbox:
                SendScheduledReports().run('2018-06-30T00')

                self.assertEqual(len(outbox), 1)

                # Test attachment
                self.assertEqual(len(outbox[0].attachments), 2)
                self.assertEqual(
                    outbox[0].attachments[0].content_type,
                    '{}; name="chart_1.png"'.format(MIME_TYPES.PNG)
                )
                self.assertEqual(outbox[0].attachments[0].filename, 'chart_1.png')
                self.assertEqual(outbox[0].attachments[0].data, b64decode(mock_array[0].get('file')))

                self.assertEqual(
                    outbox[0].attachments[1].content_type,
                    '{}; name="chart_2.png"'.format(MIME_TYPES.PNG)
                )
                self.assertEqual(outbox[0].attachments[1].filename, 'chart_2.png')
                self.assertEqual(outbox[0].attachments[1].data, b64decode(mock_array[1].get('file')))

    def test_send_report_hourly(self):
        # Test every hour
        self._test(
            report={'schedule': {'frequency': 'hourly', 'hour': -1}},
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local('2018-06-30T{}'.format(hour)) for hour in range(0, 24)]
        )

        # Test every hour, already sent this hour
        self._test(
            report={
                'schedule': {'frequency': 'hourly', 'hour': -1},
                '_last_sent': to_utc('2018-06-30T13')
            },
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local('2018-06-30T{}'.format(hour)) for hour in range(14, 24)]
        )

    def test_send_report_hour_of_the_day(self):
        # Test exact hour
        self._test(
            report={'schedule': {'frequency': 'daily', 'hour': 10}},
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local('2018-06-30T10')]
        )

        # Test exact hour, not sent this hour
        report = {
            'schedule': {'frequency': 'daily', 'hour': 10},
            '_last_sent': to_local('2018-06-30T09')
        }
        self._test(
            report=report,
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[to_local('2018-06-30T10')]
        )
        # Test running this day again
        self._test(
            report=report,
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[]
        )

        # Test exact hour, already sent this hour
        self._test(
            report={
                'schedule': {'frequency': 'daily', 'hour': 10},
                '_last_sent': to_local('2018-06-30T10')
            },
            start='2018-06-30T00',
            end='2018-06-30T23',
            expected_hits=[]
        )

    def test_send_report_daily(self):
        # Every day at 8am
        self._test(
            report={'schedule': {'frequency': 'daily', 'hour': 8}},
            start='2018-06-01T00',
            end='2018-06-30T23',
            expected_hits=[
                to_local('2018-06-{}T08'.format(day)) for day in range(1, 31)
            ]
        )

    def test_send_report_weekly(self):
        # Every Monday and Wednesday @ 4pm
        self._test(
            report={
                'schedule': {
                    'frequency': 'weekly',
                    'hour': 16,
                    'week_days': ['Monday', 'Wednesday']
                }
            },
            start='2018-06-01T00',
            end='2018-06-30T23',
            expected_hits=[
                to_local('2018-06-04T16'),  # Monday
                to_local('2018-06-06T16'),  # Wednesday
                to_local('2018-06-11T16'),  # Monday
                to_local('2018-06-13T16'),  # Wednesday
                to_local('2018-06-18T16'),  # Monday
                to_local('2018-06-20T16'),  # Wednesday
                to_local('2018-06-25T16'),  # Monday
                to_local('2018-06-27T16'),  # Wednesday
            ]
        )

    def test_send_report_week_days(self):
        # Every Monday->Frday @ 2pm
        self._test(
            report={'schedule': {
                'frequency': 'weekly',
                'hour': 14,
                'week_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            }},
            start='2018-06-01T00',
            end='2018-06-30T23',
            expected_hits=[
                to_local('2018-06-01T14'),
                to_local('2018-06-04T14'),
                to_local('2018-06-05T14'),
                to_local('2018-06-06T14'),
                to_local('2018-06-07T14'),
                to_local('2018-06-08T14'),
                to_local('2018-06-11T14'),
                to_local('2018-06-12T14'),
                to_local('2018-06-13T14'),
                to_local('2018-06-14T14'),
                to_local('2018-06-15T14'),
                to_local('2018-06-18T14'),
                to_local('2018-06-19T14'),
                to_local('2018-06-20T14'),
                to_local('2018-06-21T14'),
                to_local('2018-06-22T14'),
                to_local('2018-06-25T14'),
                to_local('2018-06-26T14'),
                to_local('2018-06-27T14'),
                to_local('2018-06-28T14'),
                to_local('2018-06-29T14'),
            ]
        )

    def test_send_report_week_ends(self):
        # Every Saturday and Sunday @ 9am
        self._test(
            report={
                'schedule': {
                    'frequency': 'weekly',
                    'hour': 9,
                    'week_days': ['Saturday', 'Sunday']
                }
            },
            start='2018-06-01T00',
            end='2018-07-01T00',
            expected_hits=[
                to_local('2018-06-02T09'),
                to_local('2018-06-03T09'),
                to_local('2018-06-09T09'),
                to_local('2018-06-10T09'),
                to_local('2018-06-16T09'),
                to_local('2018-06-17T09'),
                to_local('2018-06-23T09'),
                to_local('2018-06-24T09'),
                to_local('2018-06-30T09')
            ]
        )

    def test_send_report_monthly(self):
        self._test(
            report={
                'schedule': {
                    'frequency': 'monthly',
                    'hour': 0,
                    'day': 1
                }
            },
            start='2018-01-01T00',
            end='2018-12-31T23',
            expected_hits=[
                to_local('2018-01-01T00'),
                to_local('2018-02-01T00'),
                to_local('2018-03-01T00'),
                to_local('2018-04-01T00'),
                to_local('2018-05-01T00'),
                to_local('2018-06-01T00'),
                to_local('2018-07-01T00'),
                to_local('2018-08-01T00'),
                to_local('2018-09-01T00'),
                to_local('2018-10-01T00'),
                to_local('2018-11-01T00'),
                to_local('2018-12-01T00'),
            ]
        )
