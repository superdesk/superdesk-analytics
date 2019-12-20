# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


from superdesk.tests import TestCase

from analytics.common import get_weekstart_offset_hr, get_utc_offset_in_minutes,\
    seconds_to_human_readable, relative_to_absolute_datetime

from datetime import datetime, timedelta


class CommonTestCase(TestCase):
    def test_weekstart_offset_hr(self):
        self.app.config['START_OF_WEEK'] = 0
        self.assertEqual(get_weekstart_offset_hr(), -24)

        self.app.config['START_OF_WEEK'] = 1
        self.assertEqual(get_weekstart_offset_hr(), 0)

        self.app.config['START_OF_WEEK'] = 2
        self.assertEqual(get_weekstart_offset_hr(), 24)

        self.app.config['START_OF_WEEK'] = 3
        self.assertEqual(get_weekstart_offset_hr(), 48)

        self.app.config['START_OF_WEEK'] = 4
        self.assertEqual(get_weekstart_offset_hr(), 72)

        self.app.config['START_OF_WEEK'] = 5
        self.assertEqual(get_weekstart_offset_hr(), 96)

        self.app.config['START_OF_WEEK'] = 6
        self.assertEqual(get_weekstart_offset_hr(), 120)

    def test_utc_offset_in_minutes(self):
        self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
        self.assertEqual(
            get_utc_offset_in_minutes(datetime(2018, 10, 1)),
            600
        )

        self.assertEqual(
            get_utc_offset_in_minutes(datetime(2018, 10, 10)),
            660
        )

    def test_seconds_to_human_readable(self):
        # Seconds
        self.assertEqual(seconds_to_human_readable(1), '1 second')
        self.assertEqual(seconds_to_human_readable(1.5), '1 second')
        self.assertEqual(seconds_to_human_readable(10), '10 seconds')

        # Minutes
        self.assertEqual(seconds_to_human_readable(60), '1 minute')
        self.assertEqual(seconds_to_human_readable(90), '1 minute')
        self.assertEqual(seconds_to_human_readable(120), '2 minutes')
        self.assertEqual(seconds_to_human_readable(150), '2 minutes')

        # Hours
        self.assertEqual(seconds_to_human_readable(3600), '1 hour')
        self.assertEqual(seconds_to_human_readable(5400), '1 hour')
        self.assertEqual(seconds_to_human_readable(7200), '2 hours')
        self.assertEqual(seconds_to_human_readable(9000), '2 hours')

        # Days
        self.assertEqual(seconds_to_human_readable(86400), '1 day')
        self.assertEqual(seconds_to_human_readable(129600), '1 day')
        self.assertEqual(seconds_to_human_readable(172800), '2 days')
        self.assertEqual(seconds_to_human_readable(216000), '2 days')

    def test_relative_to_absolute_datetime(self):
        self.app.config.update({
            'DEFAULT_TIMEZONE': 'Australia/Sydney',
            'START_OF_WEEK': 0  # Sunday
        })
        fm = '%Y-%m-%dT%H:%M:%S'
        dt = datetime(2019, 10, 25, 13, 25, 52)

        # Test without any optional parameters
        self.assertEqual(relative_to_absolute_datetime('now', fm, dt), '2019-10-25T13:25:52')

        # Test rounding down
        self.assertEqual(relative_to_absolute_datetime('now/m', fm, dt), '2019-10-25T13:25:00')
        self.assertEqual(relative_to_absolute_datetime('now/h', fm, dt), '2019-10-25T13:00:00')
        self.assertEqual(relative_to_absolute_datetime('now/d', fm, dt), '2019-10-25T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now/M', fm, dt), '2019-10-01T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now/y', fm, dt), '2019-01-01T00:00:00')

        # Test subtraction
        self.assertEqual(relative_to_absolute_datetime('now-1m', fm, dt), '2019-10-25T13:24:52')
        self.assertEqual(relative_to_absolute_datetime('now-1h', fm, dt), '2019-10-25T12:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-1d', fm, dt), '2019-10-24T13:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-1w', fm, dt), '2019-10-18T13:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-1M', fm, dt), '2019-09-25T13:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-1y', fm, dt), '2018-10-25T13:25:52')

        self.assertEqual(relative_to_absolute_datetime('now-26m', fm, dt), '2019-10-25T12:59:52')
        self.assertEqual(relative_to_absolute_datetime('now-26h', fm, dt), '2019-10-24T11:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-26d', fm, dt), '2019-09-29T13:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-26w', fm, dt), '2019-04-26T13:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-26M', fm, dt), '2017-08-25T13:25:52')
        self.assertEqual(relative_to_absolute_datetime('now-26y', fm, dt), '1993-10-25T13:25:52')

        # Test subtraction and rounding down
        self.assertEqual(relative_to_absolute_datetime('now-1m/m', fm, dt), '2019-10-25T13:24:00')
        self.assertEqual(relative_to_absolute_datetime('now-1m/h', fm, dt), '2019-10-25T13:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-1m/d', fm, dt), '2019-10-25T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-1m/w', fm, dt), '2019-10-20T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-1m/M', fm, dt), '2019-10-01T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-1m/y', fm, dt), '2019-01-01T00:00:00')

        self.assertEqual(relative_to_absolute_datetime('now-26m/m', fm, dt), '2019-10-25T12:59:00')
        self.assertEqual(relative_to_absolute_datetime('now-26m/h', fm, dt), '2019-10-25T12:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-26m/d', fm, dt), '2019-10-25T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-26m/w', fm, dt), '2019-10-20T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-26m/M', fm, dt), '2019-10-01T00:00:00')
        self.assertEqual(relative_to_absolute_datetime('now-26m/y', fm, dt), '2019-01-01T00:00:00')

    def test_relative_to_absolute_datetime_week_granularity(self):
        """Starting on Sunday 2019-10-20, test shifting the week using different START_OF_WEEK values"""

        results = {
            'Sunday': {
                'start_of_week': 0,
                'results': [20, 20, 20, 20, 20, 20, 20]
            },
            'Monday': {
                'start_of_week': 1,
                'results': [14, 21, 21, 21, 21, 21, 21]
            },
            'Tuesday': {
                'start_of_week': 2,
                'results': [15, 15, 22, 22, 22, 22, 22]
            },
            'Wednesday': {
                'start_of_week': 3,
                'results': [16, 16, 16, 23, 23, 23, 23]
            },
            'Thursday': {
                'start_of_week': 4,
                'results': [17, 17, 17, 17, 24, 24, 24]
            },
            'Friday': {
                'start_of_week': 5,
                'results': [18, 18, 18, 18, 18, 25, 25]
            },
            'Saturday': {
                'start_of_week': 6,
                'results': [19, 19, 19, 19, 19, 19, 26]
            },
        }

        self.app.config['DEFAULT_TIMEZONE'] = 'Australia/Sydney'
        fm = '%Y-%m-%dT%H:%M:%S'

        for day, data in results.items():
            self.app.config['START_OF_WEEK'] = data['start_of_week']

            for i in range(0, 7):
                self.assertEqual(
                    relative_to_absolute_datetime(
                        'now/w',
                        fm,
                        datetime(2019, 10, 20 + i, 13, 25, 52)
                    ),
                    '2019-10-{}T00:00:00'.format(data['results'][i]),
                    'Expected: {} {}'.format(day, i)
                )
