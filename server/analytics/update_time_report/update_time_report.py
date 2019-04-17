# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013-2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource import Resource
from superdesk.utc import utc_to_local, utcnow

from analytics.stats.stats_report_service import StatsReportService
from analytics.chart_config import ChartConfig
from analytics.common import REPORT_CONFIG, CHART_TYPES

from flask import current_app as app
from datetime import timedelta


class UpdateTimeReportResource(Resource):
    """Update Time Report schema"""

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'update_time_report'}


class UpdateTimeReportService(StatsReportService):
    aggregations = None
    date_filter_field = 'firstpublished'

    defaultConfig = {
        REPORT_CONFIG.CHART_TYPES: {
            # Table is the only supported chart type for this report
            # The 'report_configs' endpoint will omit all others
            CHART_TYPES.TABLE: {'enabled': True}
        },
        REPORT_CONFIG.DEFAULT_PARAMS: {
            'chart': {'type': CHART_TYPES.TABLE}
        }
    }

    def get_request_aggregations(self, params, args):
        """Disable generating aggregations"""
        return None

    def generate_elastic_query(self, args):
        query = super().generate_elastic_query(args)

        query['source']['query']['filtered']['filter']['bool']['must'].extend([
            {'range': {'time_to_next_update_publish': {'gt': 0}}},
            {'exists': {'field': 'rewritten_by'}},
        ])

        query['source']['query']['filtered']['filter']['bool']['must_not'].extend([
            {'exists': {'field': 'rewrite_of'}}
        ])

        return query

    def generate_report(self, docs, args):
        for doc in docs:
            doc.pop('stats', None)
        return docs

    def generate_highcharts_config(self, docs, args):
        items = list(self.generate_report(docs, args))

        params = args.get('params') or {}
        chart_params = params.get('chart') or {}

        title = chart_params.get('title') or 'Update Time'
        subtitle = chart_params.get('subtitle') or ChartConfig.gen_subtitle_for_dates(params)

        rows = []

        def gen_date_str(date):
            return utc_to_local(
                app.config['DEFAULT_TIMEZONE'],
                date
            ).strftime('%d/%m/%Y %H:%M')

        def gen_update_string(seconds):
            times = (utcnow().replace(minute=0, hour=0, second=0)) + timedelta(seconds=seconds)
            times = times.strftime('%H:%M').split(':')

            if int(times[0]) > 0:
                return '{} hours, {} minutes'.format(times[0], times[1])

            return '{} minutes'.format(times[1])

        for item in items:
            publish_time = item.get('firstpublished')
            update_time = publish_time + timedelta(seconds=item.get('time_to_next_update_publish'))
            updated = '{} ({})'.format(
                gen_update_string(item.get('time_to_next_update_publish')),
                gen_date_str(update_time)
            )

            rows.append([
                gen_date_str(publish_time),
                item.get('slugline') or '',
                item.get('headline') or '',
                updated
            ])

        return {
            'highcharts': [{
                'id': 'update_time_report',
                'type': 'table',
                'title': title,
                'subtitle': subtitle,
                'headers': ['Published', 'Slugline', 'Headline', 'Updated In'],
                'rows': rows
            }]
        }
