# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import logging
import requests
from flask import current_app as app
import csv
from io import StringIO

from superdesk.errors import SuperdeskApiError
from analytics.common import MIME_TYPES

logger = logging.getLogger(__name__)


def generate_report(
        options,
        mimetype=MIME_TYPES.PNG,
        base64=True,
        scale=1,
        width=None,
        no_download=True
):
    if not isinstance(options, dict):
        raise SuperdeskApiError.badRequestError('Provided options must be a dictionary')

    if 'series' not in options and 'rows' not in options:
        raise SuperdeskApiError.badRequestError('Series data not provided')

    if mimetype in [
        MIME_TYPES.PNG,
        MIME_TYPES.JPEG,
        MIME_TYPES.GIF,
        MIME_TYPES.PDF,
        MIME_TYPES.SVG
    ]:
        return generate_from_highcharts(options, mimetype, base64, scale, width, no_download)
    elif mimetype == MIME_TYPES.CSV:
        return generate_csv(options)
    elif mimetype == MIME_TYPES.HTML:
        return generate_html(options)

    raise SuperdeskApiError.badRequestError("Unsupported mimetype '{}'".format(mimetype))


def generate_from_highcharts(
        options,
        mimetype=MIME_TYPES.PNG,
        base64=True,
        scale=1,
        width=None,
        no_download=True
):
    try:
        host = app.config.get('HIGHCHARTS_SERVER_HOST', 'localhost')
        port = app.config.get('HIGHCHARTS_SERVER_PORT', '6060')
    except RuntimeError:
        # This can happen when working outside of the Flask context
        # So default to host=localhost, port=6060
        host = 'localhost'
        port = '6060'

    url = 'http://{}:{}'.format(host, port)
    headers = {'Content-Type': 'application/json'}

    # Set the width size of the image to generate
    if 'exporting' not in options:
        options['exporting'] = {}
    options['exporting']['sourceWidth'] = width

    payload = {
        'options': options,
        'type': mimetype,
        'b64': base64,
        'scale': scale,
        'noDownload': no_download
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
    except requests.exceptions.ConnectionError as e:
        raise SuperdeskApiError.internalError('Socket connection error: {}'.format(e))

    try:
        response.raise_for_status()
    except Exception as e:
        logger.exception(e)
        raise SuperdeskApiError.internalError(e)

    return response.content


def generate_csv(options):
    csv_rows = options.get('csv') or []
    csv_file = StringIO()
    csv_writer = csv.writer(csv_file)

    csv_writer.writerows(csv_rows)

    return csv_file.getvalue().encode('UTF-8')


def generate_html(options):
    rows = options.get('rows') or []
    headers = options.get('headers') or []
    title = options.get('title') or ''

    if len(rows) < 1:
        return '''<div><h3>{}</h3></div>'''.format(title)

    thead = '<tr><th>{}</th></tr>'.format('</th><th>'.join(headers))
    tbody = ''
    for row in rows:
        tbody += '<tr><td>{}</td></tr>'.format(
            '</td><td>'.join([str(td) for td in row])
        )

    return '''
<div>
    <h3>{}</h3>
    <table border=1 style="width: 100%;">
        <thead>
            {}
        </thead>
        <tbody>
            {}
        </tbody>
    </table>
<div>'''.format(title, thead, tbody)
