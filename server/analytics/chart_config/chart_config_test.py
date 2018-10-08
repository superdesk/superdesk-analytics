# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from superdesk.tests import TestCase

from analytics.chart_config import ChartConfig


class ChartConfigTestCase(TestCase):
    @staticmethod
    def _gen_single_chart(chart_id, chart_type):
        chart = ChartConfig(chart_id, chart_type)
        chart.add_source('anpa_category.qcode', {'a': 3, 'b': 4, 'c': 1})
        return chart

    @staticmethod
    def _gen_stacked_chart(chart_id, chart_type):
        chart = ChartConfig(chart_id, chart_type)
        chart.add_source('anpa_category.qcode', {
            'a': {
                1: 1,
                3: 1,
            },
            'b': {
                1: 1,
                3: 2,
            },
            'c': {
                1: 2,
                3: 1,
                5: 1,
            },
        })
        chart.add_source('urgency', {1: 4, 3: 4, 5: 1})
        return chart

    def test_generate_single_series(self):
        chart = self._gen_single_chart('cid', 'bar')
        chart.title = 'Charts'
        chart.subtitle = 'For Today'

        self.assertFalse(chart.is_multi_source())
        self.assertEqual(chart.gen_config(), {
            'id': 'cid',
            'type': 'bar',
            'chart': {
                'type': 'bar',
                'zoomType': 'y',
            },
            'title': {'text': 'Charts'},
            'subtitle': {'text': 'For Today'},
            'xAxis': {
                'title': {'text': 'anpa_category.qcode'},
                'categories': ['b', 'a', 'c'],
            },
            'yAxis': {
                'title': {'text': 'Published Stories'},
                'stackLabels': {'enabled': False},
                'allowDecimals': False,
            },
            'legend': {'enabled': False},
            'tooltip': {
                'headerFormat': '{point.x}: {point.y}',
                'pointFormat': '',
            },
            'plotOptions': {
                'bar': {
                    'colorByPoint': True,
                    'dataLabels': {'enabled': True},
                },
                'column': {
                    'colorByPoint': True,
                    'dataLabels': {'enabled': True},
                },
            },
            'series': [{
                'name': 'Published Stories',
                'data': [4, 3, 1],
            }],
            'credits': {'enabled': False},
        })

    def test_sort_single_series(self):
        chart = self._gen_single_chart('cid', 'bar')
        chart.sort_order = 'asc'

        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['c', 'a', 'b'],
        })
        self.assertEqual(config['series'], [{
            'name': 'Published Stories',
            'data': [1, 3, 4]
        }])

        chart.sort_order = 'desc'
        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['b', 'a', 'c'],
        })
        self.assertEqual(config['series'], [{
            'name': 'Published Stories',
            'data': [4, 3, 1]
        }])

    def test_generate_stacked_series(self):
        chart = self._gen_stacked_chart('cid', 'column')
        chart.title = 'Charts'
        chart.subtitle = 'For Today'

        self.assertTrue(chart.is_multi_source())
        self.assertEqual(chart.gen_config(), {
            'id': 'cid',
            'type': 'column',
            'chart': {
                'type': 'column',
                'zoomType': 'x',
            },
            'title': {'text': 'Charts'},
            'subtitle': {'text': 'For Today'},
            'xAxis': {
                'title': {'text': 'anpa_category.qcode'},
                'categories': ['c', 'b', 'a'],
            },
            'yAxis': {
                'title': {'text': 'Published Stories'},
                'stackLabels': {'enabled': True},
                'allowDecimals': False,
            },
            'legend': {
                'enabled': True,
                'title': {'text': 'urgency'},
            },
            'tooltip': {
                'headerFormat': '{series.name}/{point.x}: {point.y}',
                'pointFormat': '',
            },
            'plotOptions': {
                'bar': {
                    'stacking': 'normal',
                    'colorByPoint': False,
                },
                'column': {
                    'stacking': 'normal',
                    'colorByPoint': False,
                },
            },
            'series': [{
                'name': '1',
                'data': [2, 1, 1],
            }, {
                'name': '3',
                'data': [1, 2, 1],
            }, {
                'name': '5',
                'data': [1, 0, 0]
            }],
            'credits': {'enabled': False},
        })

    def test_sort_stacked_series(self):
        chart = self._gen_stacked_chart('cid', 'bar')
        chart.sort_order = 'asc'

        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['a', 'b', 'c'],
        })
        self.assertEqual(config['series'], [{
            'name': '1',
            'data': [1, 1, 2],
        }, {
            'name': '3',
            'data': [1, 2, 1],
        }, {
            'name': '5',
            'data': [0, 0, 1]
        }])

        chart.sort_order = 'desc'
        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['c', 'b', 'a'],
        })
        self.assertEqual(config['series'], [{
            'name': '1',
            'data': [2, 1, 1],
        }, {
            'name': '3',
            'data': [1, 2, 1],
        }, {
            'name': '5',
            'data': [1, 0, 0]
        }])

    def test_generate_single_column_table(self):
        chart = self._gen_single_chart('tid', 'table')
        chart.title = 'Tables'
        chart.subtitle = 'For Today'

        self.assertFalse(chart.is_multi_source())
        self.assertEqual(chart.gen_config(), {
            'id': 'tid',
            'type': 'table',
            'chart': {'type': 'column'},
            'title': 'Tables',
            'subtitle': 'For Today',
            'xAxis': {
                'title': {'text': 'anpa_category.qcode'},
                'categories': ['b', 'a', 'c'],
            },
            'series': [{
                'name': 'Published Stories',
                'data': [4, 3, 1],
            }],
            'headers': ['anpa_category.qcode', 'Published Stories'],
            'rows': [
                ['b', 4],
                ['a', 3],
                ['c', 1]
            ],
            'credits': {'enabled': False}
        })

    def test_sort_single_column_table(self):
        chart = self._gen_single_chart('tid', 'table')
        chart.sort_order = 'asc'

        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['c', 'a', 'b']
        })
        self.assertEqual(config['series'], [{
            'name': 'Published Stories',
            'data': [1, 3, 4]
        }])
        self.assertEqual(config['rows'], [
            ['c', 1],
            ['a', 3],
            ['b', 4]
        ])

        chart.sort_order = 'desc'
        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['b', 'a', 'c']
        })
        self.assertEqual(config['series'], [{
            'name': 'Published Stories',
            'data': [4, 3, 1]
        }])
        self.assertEqual(config['rows'], [
            ['b', 4],
            ['a', 3],
            ['c', 1]
        ])

    def test_generate_multi_column_table(self):
        chart = self._gen_stacked_chart('tid', 'table')
        chart.title = 'Tables'
        chart.subtitle = 'For Today'

        self.assertTrue(chart.is_multi_source())
        self.assertEqual(chart.gen_config(), {
            'id': 'tid',
            'type': 'table',
            'chart': {'type': 'column'},
            'title': 'Tables',
            'subtitle': 'For Today',
            'xAxis': {
                'title': {'text': 'anpa_category.qcode'},
                'categories': ['c', 'b', 'a'],
            },
            'series': [{
                'name': '1',
                'data': [2, 1, 1],
            }, {
                'name': '3',
                'data': [1, 2, 1],
            }, {
                'name': '5',
                'data': [1, 0, 0],
            }],
            'headers': ['anpa_category.qcode', '1', '3', '5', 'Total Stories'],
            'rows': [
                ['c', 2, 1, 1, 4],
                ['b', 1, 2, 0, 3],
                ['a', 1, 1, 0, 2],
            ],
            'credits': {'enabled': False},
        })

    def test_sort_multi_column_table(self):
        chart = self._gen_stacked_chart('tid', 'table')
        chart.sort_order = 'asc'

        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['a', 'b', 'c'],
        })
        self.assertEqual(config['series'], [{
            'name': '1',
            'data': [1, 1, 2],
        }, {
            'name': '3',
            'data': [1, 2, 1],
        }, {
            'name': '5',
            'data': [0, 0, 1],
        }])
        self.assertEqual(config['rows'], [
            ['a', 1, 1, 0, 2],
            ['b', 1, 2, 0, 3],
            ['c', 2, 1, 1, 4],
        ])

        chart.sort_order = 'desc'
        config = chart.gen_config()
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'anpa_category.qcode'},
            'categories': ['c', 'b', 'a'],
        })
        self.assertEqual(config['series'], [{
            'name': '1',
            'data': [2, 1, 1],
        }, {
            'name': '3',
            'data': [1, 2, 1],
        }, {
            'name': '5',
            'data': [1, 0, 0],
        }])
        self.assertEqual(config['rows'], [
            ['c', 2, 1, 1, 4],
            ['b', 1, 2, 0, 3],
            ['a', 1, 1, 0, 2],
        ])

    def test_change_chart_functionality(self):
        chart = self._gen_single_chart('cid', 'bar')
        chart.title = 'Charts'
        chart.subtitle = 'For Today'

        self.assertFalse(chart.is_multi_source())

        def get_title():
            return '{} - Testing'.format(chart.title)

        def get_subtitle():
            return '{} - Test 2'.format(chart.subtitle)

        def gen_source_name(group):
            if group == 'anpa_category.qcode':
                return 'Category'
            elif group == 'genre.qcode':
                return 'Genre'
            elif group == 'source':
                return 'Source'
            elif group == 'urgency':
                return 'Urgency'
            return group

        def get_qcode_name(qcode):
            if qcode == 'a':
                return 'Advisories'
            elif qcode == 'b':
                return 'Basketball'
            elif qcode == 'c':
                return 'Cricket'
            return qcode

        def gen_source_titles(source_type, data_keys):
            return [get_qcode_name(qcode) for qcode in data_keys]

        chart.get_title = get_title
        chart.get_subtitle = get_subtitle
        chart.get_source_name = gen_source_name
        chart.get_source_titles = gen_source_titles

        config = chart.gen_config()
        self.assertEqual(config['title'], {'text': 'Charts - Testing'})
        self.assertEqual(config['subtitle'], {'text': 'For Today - Test 2'})
        self.assertEqual(config['xAxis'], {
            'title': {'text': 'Category'},
            'categories': ['Basketball', 'Advisories', 'Cricket']
        })
