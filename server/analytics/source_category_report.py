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
from superdesk.resource import Resource

from analytics.base_report import BaseReportService


class SourceCategoryReportResource(Resource):
    """Categories per source report schema
    """

    item_methods = ['GET']
    resource_methods = ['GET']
    privileges = {'GET': 'source_category_report'}


class SourceCategoryReportService(BaseReportService):
    aggregations = {
        'source_category': {
            'terms': {
                'field': 'source',
                'size': 0
            },
            'aggs': {
                'category': {
                    'terms': {
                        'field': 'anpa_category.qcode',
                        'size': 0
                    }
                }
            }
        }
    }

    def generate_report(self, docs, args):
        """Returns the category count and categories per source counts.

        :param docs: document used for generating the report
        :return dict: report
        """
        agg_buckets = self.get_aggregation_buckets(docs.hits)
        cv = get_resource_service('vocabularies').find_one(req=None, _id='categories')

        categories_by_qcode = {
            category.get('qcode'): category
            for category in cv.get('items') or []
            if category.get('is_active', True)
        }

        report = {
            'categories': {
                category.get('name'): 0
                for category in cv.get('items') or []
                if category.get('is_active', True)
            },
            'sources': {}
        }

        for source in agg_buckets.get('source_category') or []:
            source_key = source.get('key')

            # If for some reason we don't find a source key, then skip this entry
            if not source_key:
                continue

            report['sources'][source_key] = {}

            for category in (source.get('category') or {}).get('buckets') or []:
                qcode = category.get('key')
                category_key = (categories_by_qcode.get(qcode) or {}).get('name')

                # If for some reason we don't find a category key, then skip this entry
                if not category_key:
                    continue

                if category_key not in report['categories']:
                    report['categories'][category_key] = 0

                report['sources'][source_key][category_key] = category.get('doc_count') or 0
                report['categories'][category_key] += report['sources'][source_key][category_key]

        return report

    def _get_categories(self, params, categories):
        min_count = params.get('min', 1)
        max_count = params.get('max')
        sort_order = params.get('sort_order') or 'desc'

        if sort_order == 'desc':
            sorted_categories = sorted(
                categories.items(),
                key=lambda x: x[1]
            )
        else:
            sorted_categories = sorted(
                categories.items(),
                key=lambda x: -x[1]
            )

        return [
            category for category, count in sorted_categories
            if (not min_count or count >= min_count) and (not max_count or count <= max_count)
        ]

    def _get_series_data(self, sources, categories):
        series = []

        for name, totals in sources.items():
            series.append({
                'name': name,
                'data': [totals.get(category) or 0 for category in categories]
            })

        return series

    def generate_highcharts_config(self, docs, args):
        report = self.generate_report(docs, args)

        def get_title():
            return params.get('title') or 'Published Stories per Category with Source breakdown'

        def get_subtitle():
            return params.get('subtitle') or ''

        def get_series_data():
            series = []

            for name, totals in sources.items():
                series.append({
                    'name': name,
                    'data': [totals.get(category) or 0 for category in categories]
                })

            return series

        def generate_config():
            return [{
                'id': 'generic',
                'type': chart_type,
                'chart': {
                    'type': chart_type,
                    'zoomType': 'y' if chart_type == 'bar' else 'x'
                },
                'title': {'text': get_title()},
                'subtitle': {'text': get_subtitle()},
                'xAxis': {
                    'title': {'text': 'Category'},
                    'categories': categories
                },
                'yAxis': {
                    'title': {'text': 'Stories'},
                    'stackLabels': {'enabled': True}
                },
                'legend': {'enabled': True},
                'toolip': {
                    # Show the tooltip on the one line
                    'headerFormat': '{series.name}/{point.x}: {point.y}',
                    'pointFormat': ''
                },
                'plotOptions': {
                    'bar': {
                        'stacking': 'normal',
                        'size': None
                    },
                    'column': {
                        'stacking': 'normal',
                        'size': None
                    }
                },
                'series': series
            }]

        def get_base_pie_config(category, count):
            return {
                'id': category,
                'type': 'pie',
                'chart': {'type': 'pie'},
                'title': {'text': category},
                'subtitle': {'text': '{} Stories'.format(count)},
                'tooltip': {
                    'pointFormat': '{series.name}: {point.percentage:.1f}% ({point.y})'
                },
                'plotOptions': {
                    'pie': {
                        'allowPointSelect': True,
                        'dataLabels': {
                            'enabled': True,
                            'format': '{point.name}: {point.percentage:.1f}% ({point.y})'
                        },
                        'size': 300
                    }
                },
                'series': [{
                    'name': category,
                    'colorByPoint': True,
                    'data': []
                }]
            }

        def generate_pie_config():
            configs = {}
            colours = [
                '#7cb5ec',
                '#434348',
                '#90ed7d',
                '#f7a35c',
                '#8085e9',
                '#f15c80',
                '#e4d354',
                '#2b908f',
                '#f45b5b',
                '#91e8e1'
            ]

            for category in categories:
                configs[category] = get_base_pie_config(
                    category,
                    (report.get('categories') or {}).get(category) or 0
                )

            i = 0
            for source_name, source_data in sources.items():
                for category_name, category_count in source_data.items():
                    source_config = configs.get(category_name) or {}
                    series = source_config.get('series')[0]
                    series.get('data').push({
                        'name': source_name,
                        'y': category_count,
                        'color': colours[i]
                    })

                    i += 1

            return [configs[category] for category in categories]

        params = args.get('params') or {}
        chart_type = params.get('chart_type')
        sources = report.get('sources') or {}
        categories = self._get_categories(params, report.get('categories') or {})
        series = self._get_series_data(sources, categories)

        if chart_type == 'pie':
            config = generate_pie_config()
        else:
            config = generate_config()

        report['highcharts'] = config

        return report

    def generate_csv(self, docs, args):
        report = self.generate_report(docs, args)
        params = args.get('params') or {}
        sources = report.get('sources') or {}
        categories = self._get_categories(params, report.get('categories') or {})
        series = self._get_series_data(sources, categories)

        header = ['Source']
        header.extend(categories)

        rows = [header]
        for source in series:
            row = [source.get('name')]
            row.extend(source.get('data'))
            rows.append(row)

        report['csv'] = rows

        return report
