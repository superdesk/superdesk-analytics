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
from analytics.common import get_cv_by_qcode, get_name_from_qcode
from analytics.chart_config import ChartConfig

from datetime import datetime, timedelta


class ContentPublishingReportResource(Resource):
    """Content Publishing Report schema
    """

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'content_publishing_report'}


class ContentPublishingReportService(BaseReportService):
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
            }
        }

        if include != 'all':
            query['terms']['include'] = include
            query['terms']['min_doc_count'] = 0

        return query

    def run_query(self, request, params):
        aggs = params.pop('aggs', None)

        if not aggs or not (aggs.get('group') or {}).get('field'):
            self.aggregations = ContentPublishingReportService.aggregations
            return super().run_query(request, params)

        self.aggregations = {
            'parent': self._get_aggregation_query(aggs['group'])
        }

        if aggs.get('subgroup'):
            self.aggregations['parent']['aggs'] = {
                'child': self._get_aggregation_query(aggs['subgroup'])
            }

        docs = super().run_query(request, params)

        return docs

    def generate_report(self, docs, args):
        """Returns the publishing statistics

        :param docs: document used for generating the statistics
        :return dict: report
        """
        agg_buckets = self.get_aggregation_buckets(getattr(docs, 'hits'))

        report = {'groups': {}}

        has_children = 'field' in ((args.get('aggs') or {}).get('subgroup') or {})

        if has_children:
            report['subgroups'] = {}

        for parent in agg_buckets.get('parent') or []:
            parent_key = parent.get('key')

            if not parent_key:
                continue

            if not has_children:
                report['groups'][parent_key] = parent.get('doc_count') or 0
                continue

            report['groups'][parent_key] = {}

            for child in (parent.get('child') or {}).get('buckets') or []:
                child_key = child.get('key')

                if not child_key:
                    continue

                if child_key not in report['subgroups']:
                    report['subgroups'][child_key] = 0

                doc_count = child.get('doc_count') or 0
                report['groups'][parent_key][child_key] = doc_count
                report['subgroups'][child_key] += doc_count

        return report

    def generate_highcharts_config(self, docs, args):
        params = args.get('params') or {}
        aggs = args.get('aggs') or {}
        group = aggs.get('group') or {}
        subgroup = aggs.get('subgroup') or {}

        chart = params.get('chart') or {}
        chart_type = chart.get('type') or 'bar'

        report = self.generate_report(docs, args)

        chart_config = ChartConfig('content_publishing', chart_type)

        chart_config.add_source(group.get('field'), report.get('groups'))

        if report.get('subgroups'):
            chart_config.add_source(subgroup.get('field'), report['subgroups'])

        categories = get_cv_by_qcode('categories')
        genres = get_cv_by_qcode('genre')
        urgency = get_cv_by_qcode('urgency')

        def get_group_title(group):
            if group == 'anpa_category.qcode':
                return 'Category'
            elif group == 'genre.qcode':
                return 'Genre'
            elif group == 'source':
                return 'Source'
            elif group == 'urgency':
                return 'Urgency'
            return ''

        def gen_title():
            if chart.get('title'):
                return chart['title']

            group_type = group.get('field')
            group_title = get_group_title(group_type)

            if subgroup.get('field'):
                subgroup_type = subgroup.get('field')
                subgroup_title = get_group_title(subgroup_type)

                return 'Published Stories per {} with {} breakdown'.format(
                    group_title,
                    subgroup_title
                )

            return 'Published Stories per {}'.format(group_title)

        def gen_subtitle():
            if chart.get('subtitle'):
                return chart['subtitle']

            dates = params.get('dates') or {}
            date_filter = dates.get('filter')

            if date_filter == 'range':
                start = datetime.strptime(dates.get('start'), '%Y-%m-%d')
                end = datetime.strptime(dates.get('end'), '%Y-%m-%d')

                return '{} - {}'.format(
                    start.strftime('%B %-d, %Y'),
                    end.strftime('%B %-d, %Y')
                )
            elif date_filter == 'yesterday':
                return (datetime.today() - timedelta(days=1))\
                    .strftime('%A %-d %B %Y')
            elif date_filter == 'last_week':
                week = datetime.today() - timedelta(weeks=1)
                start = week - timedelta(days=week.weekday() + 1)
                end = start + timedelta(days=6)

                return '{} - {}'.format(
                    start.strftime('%B %-d, %Y'),
                    end.strftime('%B %-d, %Y')
                )
            elif date_filter == 'last_month':
                first = datetime.today().replace(day=1)
                month = first - timedelta(days=1)

                return month.strftime('%B %Y')

            return None

        def get_source_titles(source_type, data_keys):
            if source_type == 'anpa_category.qcode':
                return [
                    get_name_from_qcode(
                        categories,
                        qcode
                    )
                    for qcode in data_keys
                ]
            elif source_type == 'genre.qcode':
                return [
                    get_name_from_qcode(
                        genres,
                        qcode
                    )
                    for qcode in data_keys
                ]
            elif source_type == 'urgency':
                return [
                    get_name_from_qcode(
                        urgency,
                        qcode
                    )
                    for qcode in data_keys
                ]

            return data_keys

        def get_source_title(source_type, qcode):
            if source_type == 'anpa_category.qcode':
                return get_name_from_qcode(
                    categories,
                    qcode
                )
            elif source_type == 'genre.qcode':
                return get_name_from_qcode(
                    genres,
                    qcode
                )
            elif source_type == 'urgency':
                return get_name_from_qcode(
                    urgency,
                    qcode
                )

            return qcode

        chart_config.get_title = gen_title
        chart_config.get_subtitle = gen_subtitle
        chart_config.get_source_name = get_group_title
        chart_config.get_source_titles = get_source_titles
        chart_config.get_source_title = get_source_title
        chart_config.sort_order = chart.get('sort_order') or 'desc'

        report['highcharts'] = [chart_config.gen_config()]

        return report
