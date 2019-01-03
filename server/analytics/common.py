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
from collections import namedtuple
from subprocess import check_call, PIPE
from flask import current_app as app
import pytz
from datetime import datetime
from math import floor


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
