# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import subprocess
import logging

logger = logging.getLogger(__name__)


def get_app_config():
    try:
        import settings
        return {
            'HIGHCHARTS_SERVER_HOST': getattr(settings, 'HIGHCHARTS_SERVER_HOST', 'localhost'),
            'HIGHCHARTS_SERVER_PORT': getattr(settings, 'HIGHCHARTS_SERVER_PORT', '6060')
        }
    except ImportError:
        return {
            'HIGHCHARTS_SERVER_HOST': 'localhost',
            'HIGHCHARTS_SERVER_PORT': '6060'
        }


def run_server():
    logger.info('Starting Highcharts Export Server')

    config = get_app_config()
    try:
        subprocess.run([
            "highcharts-export-server",
            "--enableServer", "1",
            "--host", config.get('HIGHCHARTS_SERVER_HOST', 'localhost'),
            "--port", config.get('HIGHCHARTS_SERVER_PORT', '6060')
        ])
    except FileNotFoundError as e:
        logger.error('Failed to run the Highcharts Export Server: {}'.format(e))
    except KeyboardInterrupt:
        pass


if __name__ == '__main__':
    run_server()
