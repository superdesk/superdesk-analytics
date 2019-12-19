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
from superdesk.utc import utcnow, utc_to_local
from collections import namedtuple
from subprocess import check_call, PIPE
from flask import current_app as app
import pytz
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from math import floor
import re
import logging

logger = logging.getLogger(__name__)


mime_types = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'application/pdf',
    'image/svg+xml',
    'text/csv',
    'text/html'
]

MIME_TYPES = namedtuple('MIME_TYPES', [
    'PNG',
    'JPEG',
    'GIF',
    'PDF',
    'SVG',
    'CSV',
    'HTML'
])(*mime_types)

date_filters = [
    # ABSOLUTE
    'range',
    'day',

    # HOURS
    'relative_hours',

    # DAYS
    'relative_days',
    'yesterday',
    'today',

    # WEEKS
    'relative_weeks',
    'last_week',
    'this_week',

    # MONTHS
    'relative_months',
    'last_month',
    'this_month',

    # YEARS
    'last_year',
    'this_year'
]

DATE_FILTERS = namedtuple('DATE_FILTERS', [
    # ABSOLUTE
    'RANGE',
    'DAY',

    # HOURS
    'RELATIVE_HOURS',

    # DAYS
    'RELATIVE_DAYS',
    'YESTERDAY',
    'TODAY',

    # WEEKS
    'RELATIVE_WEEKS',
    'LAST_WEEK',
    'THIS_WEEK',

    # MONTHS
    'RELATIVE_MONTHS',
    'LAST_MONTH',
    'THIS_MONTH',

    # YEARS
    'LAST_YEAR',
    'THIS_YEAR'
])(*date_filters)

chart_types = [
    'bar',
    'column',
    'table',
    'area',
    'line',
    'pie',
    'scatter',
    'spline'
]

CHART_TYPES = namedtuple('CHART_TYPES', [
    'BAR',
    'COLUMN',
    'TABLE',
    'AREA',
    'LINE',
    'PIE',
    'SCATTER',
    'SPLINE'
])(*chart_types)

report_config = [
    'date_filters',
    'chart_types',
    'default_params'
]

REPORT_CONFIG = namedtuple('REPORT_CONFIG', [
    'DATE_FILTERS',
    'CHART_TYPES',
    'DEFAULT_PARAMS'
])(*report_config)


def get_mime_type_extension(mimetype):
    if mimetype == MIME_TYPES.PNG:
        return 'png'
    elif mimetype == MIME_TYPES.JPEG:
        return 'jpeg'
    elif mimetype == MIME_TYPES.GIF:
        return 'gif'
    elif mimetype == MIME_TYPES.PDF:
        return 'pdf'
    elif mimetype == MIME_TYPES.SVG:
        return 'svg'
    elif mimetype == MIME_TYPES.CSV:
        return 'csv'
    elif mimetype == MIME_TYPES.HTML:
        return 'html'


registered_reports = {}


def register_report(report_type, report_endpoint):
    registered_reports[report_type] = report_endpoint


def get_report_service(report_type):
    try:
        return get_resource_service(
            registered_reports[report_type]
        )
    except KeyError:
        return None


def is_highcharts_installed():
    try:
        check_call(['which', 'highcharts-export-server'], stdout=PIPE, stderr=PIPE)
        return True
    except Exception:
        return False


def get_cv_by_qcode(name, field=None):
    cvs = get_resource_service('vocabularies').find_one(req=None, _id=name)
    return {} if not cvs else {
        item.get('qcode'): item if field is None else item.get(field)
        for item in cvs.get('items') or []
        if item.get('is_active', True)
    }


def get_elastic_version():
    return app.data.elastic.es.info()['version']['number']


def get_weekstart_offset_hr():
    """Calculates the offset in hours for the configured start of the week

    This method is used with elasticsearch to provide an offset for histogram queries
    where the default buckets for week are based on the week starting on a Monday.

    :return: Week start offset in hours relative to Monday
    """
    offset = 0

    start_of_week = app.config.get('START_OF_WEEK') or 0
    if start_of_week == 0:
        offset -= 24
    elif start_of_week > 1:
        offset += (start_of_week - 1) * 24

    return offset


def get_utc_offset_in_minutes(utc_datetime):
    """Calculates the UTC Offset in minutes for the supplied datetime instance

    :param datetime utc_datetime: The date/time instance used to calculate utc offset
    :return: UTC Offset in minutes
    """
    timezone = pytz.timezone(app.config['DEFAULT_TIMEZONE'])
    return timezone.utcoffset(utc_datetime).total_seconds() / 60


def seconds_to_human_readable(seconds):
    """Converts seconds to a human readable format

    :param float seconds: Seconds to convert
    :return string: Human readable duration
    """
    if seconds >= 86400:
        if floor(seconds / 86400) == 1:
            return '1 day'

        return '{} days'.format(floor(seconds / 86400))
    elif seconds >= 3600:
        if floor(seconds / 3600) == 1:
            return '1 hour'

        return '{} hours'.format(floor(seconds / 3600))
    elif seconds >= 60:
        if floor(seconds / 60) == 1:
            return '1 minute'

        return '{} minutes'.format(floor(seconds / 60))
    elif floor(seconds) == 1:
        return '1 second'

    return '{} seconds'.format(floor(seconds))


def relative_to_absolute_datetime(value, format, now=None, offset=None):
    """Converts a relative datetime to an absolute datetime in the format provided

    Formats supported include:
    now
    now/[g]
    now-[o]
    now-[o]/[g]

    g = granularity (rounding the value down to the nearest value)
        - m = minute
        - h = hour
        - d = day (first hour/minute/second of the day)
        - w = week (first day of the week, using the system configured START_OF_WEEK value)
        - M = month (the first day of the month)
        - y = year (the first day of the year)

    o = offset from now suffixed by the granularity (see above for supported values)

    examples:
    now
    now/d
    now-1d
    now-1d/d

    :param string value: The relative datetime
    :param string format: The format used to convert the datetime instance back to a string
    :param datetime now: The date and time to use for relative calculations (defaults to now using DEFAULT_TIMEZONE)
    :param number offset: The utc offset in minutes (defaults to offset using the DEFAULT_TIMEZONE config)
    :return string: The absolute datetime in the format provided

    """

    try:
        values = re.search(r'^now(?P<offset>(-\d+[mhdwMy])?)(?P<granularity>(/[mhdwMy])?)$', value).groupdict()
    except AttributeError as e:
        logger.exception('Value {} is in incorrect relative format'.format(value))
        raise

    if now is None:
        now = utc_to_local(app.config.get('DEFAULT_TIMEZONE'), utcnow())

    if values.get('offset'):
        # Retrieve the offset value and granularity, then shift the datetime

        granularity = values['offset'][-1]
        offset = int(values['offset'][1:-1])

        if granularity == 'm':
            now = now - timedelta(minutes=offset)
        elif granularity == 'h':
            now = now - timedelta(hours=offset)
        elif granularity == 'd':
            now = now - timedelta(days=offset)
        elif granularity == 'w':
            now = now - timedelta(weeks=offset)
        elif granularity == 'M':
            now = now - relativedelta(months=offset)
        elif granularity == 'y':
            now = now - relativedelta(years=offset)

    if values.get('granularity'):
        # Round the value down using the granularity provided

        granularity = values['granularity'][1:]

        parts = None
        if granularity == 'm':
            parts = {'second': 0}
        elif granularity == 'h':
            parts = {
                'second': 0,
                'minute': 0
            }
        elif granularity == 'd':
            parts = {
                'second': 0,
                'minute': 0,
                'hour': 0
            }
        elif granularity == 'w':
            # Using START_OF_WEEK to calculate the number of days to shift for the beginning of the week
            # START_OF_WEEK
            #   0: Sunday
            #   6: Saturday

            isoweekday = now.isoweekday()
            if isoweekday == 7:
                isoweekday = 0

            start_of_week = app.config.get('START_OF_WEEK') or 0
            offset = 7 - start_of_week + isoweekday

            if offset < 7:
                now -= timedelta(days=offset)
            elif offset > 7:
                now -= timedelta(days=offset - 7)

            parts = {
                'second': 0,
                'minute': 0,
                'hour': 0
            }
        elif granularity == 'M':
            parts = {
                'second': 0,
                'minute': 0,
                'hour': 0,
                'day': 1
            }
        elif granularity == 'y':
            parts = {
                'second': 0,
                'minute': 0,
                'hour': 0,
                'day': 1,
                'month': 1
            }

        if parts:
            # Sets the second, minute, hour, day and/or month of the shifted value provided
            now = now.replace(**parts)

    return now.strftime(format)
