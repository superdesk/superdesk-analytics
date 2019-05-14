# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

import superdesk
from superdesk.celery_app import celery
from superdesk.default_settings import env
from superdesk.default_settings import crontab

from .archive_statistics import ArchiveStatisticsResource, ArchiveStatisticsService
from .gen_archive_statistics import GenArchiveStatistics
from .featuremedia_updates import *  # noqa


def init_app(app):
    if not app.config.get('STATISTICS_MONGO_DBNAME'):
        app.config['STATISTICS_MONGO_DBNAME'] = env('STATISTICS_MONGO_DBNAME', 'statistics')

    db_name = app.config['STATISTICS_MONGO_DBNAME']

    if not app.config.get('STATISTICS_MONGO_URI'):
        app.config['STATISTICS_MONGO_URI'] = env(
            'STATISTICS_MONGO_URI',
            'mongodb://localhost/%s' % db_name
        )

    if not app.config.get('STATISTICS_ELASTIC_URL'):
        app.config['STATISTICS_ELASTIC_URL'] = env(
            'STATISTICS_ELASTIC_URL',
            app.config['ELASTICSEARCH_URL']
        )

    if not app.config.get('STATISTICS_ELASTIC_INDEX'):
        app.config['STATISTICS_ELASTIC_INDEX'] = env('STATISTICS_ELASTIC_INDEX', db_name)

    init_gen_stats_task(app)

    endpoint_name = ArchiveStatisticsResource.endpoint_name
    service = ArchiveStatisticsService(
        endpoint_name,
        backend=superdesk.get_backend()
    )
    ArchiveStatisticsResource(
        endpoint_name,
        app=app,
        service=service
    )


def init_gen_stats_task(app):
    # Check the application config to see if archive stats is enabled
    if not app.config.get('ANALYTICS_ENABLE_ARCHIVE_STATS', False):
        return

    # Make sure the BEAT_SCHEDULE are set
    if not app.config.get('CELERY_BEAT_SCHEDULE'):
        app.config['CELERY_BEAT_SCHEDULE'] = {}

    # If the celery schedule is not configured, then set the default now
    if not app.config['CELERY_BEAT_SCHEDULE'].get('analytics:gen_archive_stats'):
        app.config['CELERY_BEAT_SCHEDULE']['analytics:gen_archive_stats'] = {
            'task': 'analytics.stats.gen_archive_stats',
            'schedule': crontab(minute='0')  # Runs every hour
        }


@celery.task(soft_time_limit=600)
def gen_archive_stats():
    GenArchiveStatistics().run()
