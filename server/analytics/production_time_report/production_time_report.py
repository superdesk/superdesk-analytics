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

from analytics.stats.stats_report_service import StatsReportService
from analytics.chart_config import SDChart, ChartConfig
from analytics.common import seconds_to_human_readable


class ProductionTimeReportResource(Resource):
    """Desk Activity Report schema"""

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'production_time_report'}


class ProductionTimeReportService(StatsReportService):
    aggregations = {
        'operations': {
            'terms': {
                'field': 'stats.timeline.operation',
                'size': 0
            }
        }
    }
    histogram_source_field = 'stats.timeline.operation_created'
    date_filter_field = 'versioncreated'

    def get_request_aggregations(self, params, args):
        params = args.get('params') or {}
        lt, gte, time_zone = self._es_get_date_filters(params)

        return {
            'inner': {
                'nested': {'path': 'stats.desk_transitions'},
                'aggs': {
                    'date_filter': {
                        'filter': {
                            'range': {
                                'stats.desk_transitions.entered': {
                                    'gte': gte,
                                    'lt': lt,
                                    'time_zone': time_zone
                                }
                            }
                        },
                        'aggs': {
                            'desks': {
                                'terms': {
                                    'field': 'stats.desk_transitions.desk',
                                    'size': 0
                                },
                                'aggs': {
                                    'stats': {
                                        'stats': {
                                            'field': 'stats.desk_transitions.duration'
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

    def generate_report(self, docs, args):
        aggregations = getattr(docs, 'hits', {}).get('aggregations') or {}

        date_filter = (aggregations.get('inner') or {}).get('date_filter') or {}
        desk_buckets = (date_filter.get('desks') or {}).get('buckets') or []

        if len(desk_buckets) < 1:
            return {}

        report = {'desk_stats': {}}

        for bucket in desk_buckets:
            desk_id = bucket.get('key')

            if not desk_id:
                continue

            stats = bucket.get('stats') or {}

            report['desk_stats'][desk_id] = {
                'count': stats.get('count') or 0,
                'min': stats.get('min') or 0,
                'max': stats.get('max') or 0,
                'avg': stats.get('avg') or 0,
                'sum': stats.get('sum') or 0
            }

        return report

    def generate_highcharts_config(self, docs, args):
        params = args.get('params') or {}
        chart_params = params.get('chart') or {}
        report = self.generate_report(docs, args)

        stats = params.get('stats') or {}
        desk_stats = report.get('desk_stats') or {}
        desk_ids = list(desk_stats.keys())
        stat_types = [
            stat
            for stat in ['sum', 'max', 'avg', 'min']
            if stats.get(stat)
        ]
        sort_order = chart_params.get('sort_order') or 'desc'

        def get_sum_stats(desk_id):
            return sum([
                value
                for stat, value in desk_stats[desk_id].items()
                if stat in stat_types
            ])

        sorted_desk_ids = [
            desk_id
            for desk_id in sorted(
                desk_ids,
                key=lambda kv: get_sum_stats(kv) if sort_order == 'asc'
                else -get_sum_stats(kv)
            )
        ]

        if chart_params.get('subtitle'):
            subtitle = chart_params['subtitle']
        else:
            subtitle = ChartConfig.gen_subtitle_for_dates(params)

        chart = SDChart.Chart(
            'production_time_report',
            chart_type='highcharts',
            title=chart_params.get('title') or 'Production Times',
            subtitle=subtitle,
            default_config=ChartConfig.defaultConfig,
            colour_by_point=False,
            data_labels=True,
            legend_title='Production Time',
            tooltip_header='{series.name}/{point.x}: {point.y}',
            translations=ChartConfig.get_translations(['task.desk'])
        )

        chart.set_translation('production_stats', 'Production Stats', {
            'min': 'Minimum',
            'sum': 'Sum',
            'avg': 'Average',
            'max': 'Maximum'
        })

        axis = chart.add_axis().set_options(
            type='category',
            default_chart_type=chart_params.get('type') or 'column',
            y_title='Seconds spent producing content',
            category_field='task.desk',
            categories=sorted_desk_ids,
            stack_labels=False
        )

        def gen_data_entry(stat):
            return {
                'dataLabels': {
                    'enabled': True,
                    'format': seconds_to_human_readable(stat)
                },
                'y': stat
            }

        for stat_type in stat_types:
            axis.add_series().set_options(
                field='production_stats',
                name=stat_type,
                stack=0,
                stack_type='normal',
                data=[
                    gen_data_entry((desk_stats.get(desk_id) or {}).get(stat_type) or 0)
                    for desk_id in sorted_desk_ids
                ]
            )

        report['highcharts'] = [chart.gen_config()]

        return report
