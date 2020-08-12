# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.resource import Resource

from analytics.base_report import BaseReportService
from analytics.chart_config import ChartConfig
from superdesk import get_resource_service


class PublishingPerformanceReportResource(Resource):
    """Publishing Performance Report schema
    """

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'publishing_performance_report'}


class PublishingPerformanceReportService(BaseReportService):
    repos = ['published', 'archived']
    aggregations = {
        'source': {
            'terms': {
                'field': 'source',
                'size': 0,
            }
        }
    }

    @staticmethod
    def _get_aggregation_query(agg):
        include = agg.get('filter') or 'all'

        query = {
            'terms': {
                'field': agg.get('field'),
                'size': agg.get('size') or 0
            },
            'aggs': {
                'no_rewrite_of': {
                    'filter': {
                        'not': {
                            'filter': {
                                'exists': {
                                    'field': 'rewrite_of'
                                }
                            }
                        }
                    },
                    'aggs': {
                        'state': {
                            'terms': {
                                'field': 'state'
                            }
                        }
                    }
                },
                'rewrite_of': {
                    'filter': {
                        'exists': {
                            'field': 'rewrite_of'
                        }
                    },
                    'aggs': {
                        'state': {
                            'terms': {
                                'field': 'state'
                            }
                        }
                    }
                }
            }
        }

        if include != 'all':
            query['terms']['include'] = include
            query['terms']['min_doc_count'] = 0

        return query

    def get_aggregations(self, params, args):
        aggs = params.get('aggs') or {}

        if not aggs or not (aggs.get('group') or {}).get('field'):
            return PublishingPerformanceReportService.aggregations

        aggregations = {
            'parent': self._get_aggregation_query(aggs['group'])
        }

        return aggregations

    def generate_report(self, docs, args):
        """Returns the publishing statistics

        :param docs: document used for generating the statistics
        :return dict: report
        """
        agg_buckets = self.get_aggregation_buckets(getattr(docs, 'hits'), ['parent'])

        states = ['killed', 'corrected', 'updated', 'published', 'recalled']

        report = {
            'groups': {},
            'subgroups': {state: 0 for state in states}
        }

        for parent in agg_buckets.get('parent') or []:
            parent_key = parent.get('key')

            if not parent_key:
                continue

            report['groups'][parent_key] = {state: 0 for state in states}

            no_rewrite_of = (parent.get('no_rewrite_of') or {}).get('state') or {}
            rewrite_of = (parent.get('rewrite_of') or {}).get('state') or {}

            for child in no_rewrite_of.get('buckets') or []:
                state_key = child.get('key')

                if not state_key or state_key not in states:
                    continue

                doc_count = child.get('doc_count') or 0

                report['groups'][parent_key][state_key] += doc_count
                report['subgroups'][state_key] += doc_count

            for child in rewrite_of.get('buckets') or []:
                state_key = child.get('key')

                if not state_key or state_key not in states:
                    continue

                if state_key == 'published':
                    state_key = 'updated'

                doc_count = child.get('doc_count') or 0

                report['groups'][parent_key][state_key] += doc_count
                report['subgroups'][state_key] += doc_count

        if args and args.get('show_all_desks'):

            desk_with_no_articles = {'killed': 0, 'corrected': 0, 'updated': 0, 'published': 0, 'recalled': 0}
            report_groups = list(report['groups'])
            desks = get_resource_service('desks').get(req=None, lookup={})

            for desk in list(desks):
                if str(desk['_id']) not in report_groups:
                    report['groups'][str(desk['_id'])] = desk_with_no_articles

        return report

    def generate_highcharts_config(self, docs, args):
        params = args.get('params') or {}
        aggs = args.get('aggs') or {}
        group = aggs.get('group') or {}
        subgroup = aggs.get('subgroup') or {}
        translations = args.get('translations') or {}

        chart = params.get('chart') or {}
        chart_type = chart.get('type') or 'bar'

        report = self.generate_report(docs, args)

        chart_config = ChartConfig('content_publishing', chart_type)

        group_keys = list(report['groups'].keys())
        if len(group_keys) == 1 and report.get('subgroups'):
            chart_config.add_source(
                subgroup.get('field'),
                report['subgroups']
            )
            chart_config.load_translations(group.get('field'))
        else:
            chart_config.add_source(group.get('field'), report.get('groups'))
            if report.get('subgroups'):
                chart_config.add_source(subgroup.get('field'), report['subgroups'])

        def gen_title():
            if chart.get('title'):
                return chart['title']

            group_type = group.get('field')
            group_title = chart_config.get_source_name(group_type)

            if len(group_keys) == 1 and report.get('subgroups'):
                data_name = chart_config.get_source_title(
                    group_type,
                    group_keys[0]
                )

                return 'Published Stories for {}: {}'.format(
                    group_title,
                    data_name
                )

            return 'Published Stories per {}'.format(group_title)

        def gen_subtitle():
            return ChartConfig.gen_subtitle_for_dates(params)

        chart_config.get_title = gen_title
        chart_config.get_subtitle = gen_subtitle
        chart_config.sort_order = chart.get('sort_order') or 'desc'

        chart_config.translations = translations

        report['highcharts'] = [chart_config.gen_config()]

        return report
