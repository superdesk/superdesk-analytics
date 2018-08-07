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
from superdesk.errors import SuperdeskApiError

logger = logging.getLogger(__name__)


def generate_report(
        options,
        chart_type='png',
        base64=True,
        scale=1,
        width=None,
        no_download=True
):
    if not isinstance(options, dict):
        raise SuperdeskApiError.badRequestError('Provided options must be a dictionary')

    if not options.get('series'):
        raise SuperdeskApiError.badRequestError('Series data not provided')

    if chart_type in ['jpg', 'png', 'pdf', 'svg']:
        return _generate_from_highcharts(options, chart_type, base64, scale, width, no_download)

    raise SuperdeskApiError.badRequestError("Unsupported chart type '{}'".format(chart_type))


def _generate_from_highcharts(
        options,
        chart_type='png',
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
    payload = {
        'options': options,
        'type': chart_type,
        'b64': base64,
        'scale': scale,
        'width': width,
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
