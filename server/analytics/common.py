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

report_types = [
    'activity_report',
    'content_quota_report',
    'processed_items_report',
    'source_category_report',
    'track_activity_report',
    'mission_report',
    'content_publishing_report'
]

REPORT_TYPES = namedtuple('REPORT_TYPES', [
    'ACTIVITY',
    'CONTENT_QUOTA',
    'PROCESSED_ITEMS',
    'SOURCE_CATEGORY',
    'TRACK_ACTIVITY',
    'MISSION',
    'CONTENT_PUBLISHING'
])(*report_types)

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


def get_report_service(report_type):
    if report_type == REPORT_TYPES.ACTIVITY:
        return get_resource_service('activity_report')
    elif report_type == REPORT_TYPES.CONTENT_QUOTA:
        return get_resource_service('content_quota_report')
    elif report_type == REPORT_TYPES.PROCESSED_ITEMS:
        return get_resource_service('processed_items_report')
    elif report_type == REPORT_TYPES.SOURCE_CATEGORY:
        return get_resource_service('source_category_report')
    elif report_type == REPORT_TYPES.TRACK_ACTIVITY:
        return get_resource_service('track_activity_report')
    elif report_type == REPORT_TYPES.MISSION:
        return get_resource_service('mission_report')
    elif report_type == REPORT_TYPES.CONTENT_PUBLISHING:
        return get_resource_service('content_publishing_report')

    return None


def is_highcharts_installed():
    try:
        check_call(['which', 'highcharts-export-server'], stdout=PIPE, stderr=PIPE)
        return True
    except Exception:
        return False


def get_cv_by_qcode(name):
    cvs = get_resource_service('vocabularies').find_one(req=None, _id=name)
    return {
        item.get('qcode'): item
        for item in cvs.get('items') or []
        if item.get('is_active', True)
    }


def get_name_from_qcode(data, qcode):
    return (data.get(qcode) or {}).get('name') or qcode
