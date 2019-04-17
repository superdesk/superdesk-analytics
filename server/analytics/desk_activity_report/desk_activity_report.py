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
from superdesk.errors import SuperdeskApiError

from analytics.base_report import BaseReportService
from analytics.stats.common import ENTER_DESK_OPERATIONS, EXIT_DESK_OPERATIONS
from analytics.chart_config import SDChart, ChartConfig
from analytics.common import get_utc_offset_in_minutes, REPORT_CONFIG, CHART_TYPES

from flask import current_app as app
from datetime import datetime


class DeskActivityReportResource(Resource):
    """Desk Activity Report schema"""

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'desk_activity_report'}


class DeskActivityReportService(BaseReportService):
    aggregations = {
        'operations': {
            'terms': {
                'field': 'stats.timeline.operation',
                'size': 0
            }
        }
    }
    repos = ['archive_statistics']
    histogram_source_field = 'stats.timeline.operation_created'
    date_filter_field = 'versioncreated'

    defaultConfig = {
        REPORT_CONFIG.CHART_TYPES: {
            CHART_TYPES.BAR: {'enabled': True},
            CHART_TYPES.COLUMN: {'enabled': True},
            CHART_TYPES.LINE: {'enabled': True},
            CHART_TYPES.AREA: {'enabled': True},
            CHART_TYPES.SCATTER: {'enabled': True},
            CHART_TYPES.SPLINE: {'enabled': True},

            # Disable Table as generating tables for time base charts is currently not supported
            # The 'report_configs' endpoint will omit it from the result
            # CHART_TYPES.TABLE: {'enabled': False}
        }
    }

    def get_request_aggregations(self, params, args):
        aggs = super().get_request_aggregations(params, args)
        params = args.get('params') or {}
        lt, gte, time_zone = self._es_get_date_filters(params)

        desk_id = (args.get('params') or {}).get('desk')

        if not desk_id:
            raise SuperdeskApiError.badRequestError('Desk must be provided')

        new_aggs = {
            'timeline': {
                'nested': {'path': 'stats.timeline'},
                'aggs': {
                    'desk_filter': {
                        'filter': {
                            'term': {'stats.timeline.task.desk': desk_id},
                        },
                        'aggs': {
                            'timeline_filter': {
                                'filter': {
                                    'range': {
                                        'stats.timeline.operation_created': {
                                            'gte': gte,
                                            'lt': lt,
                                            'time_zone': time_zone
                                        }
                                    }
                                },
                                'aggs': aggs
                            }
                        }

                    }
                }
            }
        }

        return new_aggs

    def _get_filters(self, repos, invisible_stages):
        return None

    def get_elastic_index(self, types):
        return 'statistics'

    def generate_report(self, docs, args):
        aggregations = getattr(docs, 'hits', {}).get('aggregations') or {}
        desk_filter = ((aggregations.get('timeline') or {}).get('desk_filter') or {})
        agg_dates = (desk_filter.get('timeline_filter') or {}).get('dates') or {}
        date_buckets = agg_dates.get('buckets') or []

        if len(date_buckets) < 1:
            return {}

        report = {
            'start': date_buckets[0].get('key_as_string'),
            'start_epoch': date_buckets[0].get('key'),
            'interval': self.get_histogram_interval_ms(args),
            'incoming': [],
            'outgoing': [],
            'histogram': []
        }

        for bucket in date_buckets:
            op_buckets = (bucket.get('operations') or {}).get('buckets') or []
            histogram = {
                'interval': bucket.get('key_as_string'),
                'epoch': bucket.get('key'),
                'incoming': {
                    key: 0
                    for key in ENTER_DESK_OPERATIONS
                },
                'outgoing': {
                    key: 0
                    for key in EXIT_DESK_OPERATIONS
                },
                'other': {}
            }

            incoming = 0
            outgoing = 0

            for operation in op_buckets:
                key = operation.get('key')
                doc_count = operation.get('doc_count')

                if key in ENTER_DESK_OPERATIONS:
                    incoming += doc_count
                    histogram['incoming'][key] = doc_count
                elif key in EXIT_DESK_OPERATIONS:
                    outgoing += doc_count
                    histogram['outgoing'][key] = doc_count
                else:
                    histogram['other'][key] = doc_count

            report['incoming'].append(incoming)
            report['outgoing'].append(outgoing)
            report['histogram'].append(histogram)

        return report

    def generate_highcharts_config(self, docs, args):
        params = args.get('params') or {}
        report = self.generate_report(docs, args)
        histogram = params.get('histogram') or {}

        def gen_chart_config():
            chart_params = params.get('chart') or {}

            if chart_params.get('title'):
                title = chart_params['title']
            else:
                interval = histogram.get('interval') or 'daily'
                if interval == 'hourly':
                    title = 'Hourly Desk Activity'
                else:
                    title = 'Daily Desk Activity'

            if chart_params.get('subtitle'):
                subtitle = chart_params['subtitle']
            else:
                subtitle = ChartConfig.gen_subtitle_for_dates(params)

            # Calculate the UTC Offset in minutes for the start date of the results
            # This will cause an issue if a report crosses over the daylight savings change
            # Any data after the daylight savings change will be 1 hour out
            timezone_offset = get_utc_offset_in_minutes(
                datetime.utcfromtimestamp(int(report['start_epoch'] / 1000))
            )

            chart = SDChart.Chart(
                'desk_activity_report',
                title=title,
                subtitle=subtitle,
                chart_type='highcharts',
                start_of_week=app.config.get('START_OF_WEEK') or 0,
                timezone_offset=timezone_offset,
                use_utc=False,
                legend_title='Desk Transitions',
                default_config=ChartConfig.defaultConfig
            )

            chart.set_translation('desk_transition', 'Desk Transitions', {
                'incoming': 'Incoming',
                'outgoing': 'Outgoing'
            })

            axis = chart.add_axis().set_options(
                y_title='Desk Activity',
                type='datetime',
                default_chart_type=chart_params.get('type') or 'column',
                point_start=report.get('start_epoch'),
                point_interval=report.get('interval'),
                stack_labels=False
            )

            axis.add_series().set_options(
                field='desk_transition',
                name='incoming',
                data=report.get('incoming')
            )

            axis.add_series().set_options(
                field='desk_transition',
                name='outgoing',
                data=report.get('outgoing')
            )

            return chart.gen_config()

        def gen_table_config():
            headers = [
                'Date/Time' if histogram.get('interval') == 'hourly' else 'Date',

                'Total Incoming',
                'Create',
                'Fetch',
                'Duplicate',
                'Sent To',
                'Deschedule',
                'Unspike',

                'Total Outgoing',
                'Publish',
                'Spike',
                'Sent From',
                'Publish Scheduled',
                'Publish Embargo'
            ]

            rows = []

            for activity in report.get('histogram'):
                interval = datetime.strptime(
                    activity.get('interval'),
                    '%Y-%m-%dT%H:%M:%S'
                )

                row = [interval.strftime(
                    '%b %-d %H:%M' if histogram.get('interval') == 'hourly' else '%b %-d'
                )]

                incoming = activity.get('incoming') or {}
                incoming_rows = [
                    incoming.get(field) or 0
                    for field in ENTER_DESK_OPERATIONS
                ]
                row.append(sum(incoming_rows))
                row.extend(incoming_rows)

                outgoing = activity.get('outgoing') or {}
                outgoing_rows = [
                    outgoing.get(field) or 0
                    for field in EXIT_DESK_OPERATIONS
                ]
                row.append(sum(outgoing_rows))
                row.extend(outgoing_rows)

                rows.append(row)

            return {
                'id': 'desk_activity_report_table',
                'type': 'table',
                'chart': {'type': 'column'},
                'headers': headers,
                'title': 'Desk Activity',
                'rows': rows
            }

        report['highcharts'] = [
            gen_chart_config(),
            gen_table_config()
        ]

        return report
