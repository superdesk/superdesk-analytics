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

from analytics.chart_config import SDChart


class SDChartChartTestCase(TestCase):
    def setUp(self):
        self.maxDiff = None

    def _gen_config(self, **chart_config):
        chart = SDChart.Chart('test_chart', **chart_config)

        return chart.gen_config()

    def assertConfigEqual(self, generated, expected):
        for key, val in expected.items():
            self.assertEqual(val, generated.get(key))

    def test_default_config(self):
        self.assertEqual(
            self._gen_config(),
            {
                'id': 'test_chart',
                'type': 'highcharts',
                'chart': {},
                'time': {'useUTC': True},
                'legend': {'enabled': False},
                'tooltip': {},
                'plotOptions': {'series': {'dataLabels': {'enabled': False}}},
                'fullHeight': False
            }
        )

        self.assertEqual(
            self._gen_config(
                default_config={
                    'credits': {'enabled': False},
                    'title': {'text': 'Default Title'},
                    'subtitle': {'text': 'Default Subtitle'},
                    'plotOptions': {'series': {'shadow': True}}
                }
            ),
            {
                'id': 'test_chart',
                'type': 'highcharts',
                'chart': {},
                'time': {'useUTC': True},
                'legend': {'enabled': False},
                'tooltip': {},
                'plotOptions': {
                    'series': {
                        'dataLabels': {'enabled': False},
                        'shadow': True
                    }
                },
                'credits': {'enabled': False},
                'title': {'text': 'Default Title'},
                'subtitle': {'text': 'Default Subtitle'},
                'fullHeight': False
            }
        )

    def test_set_options(self):
        self.assertConfigEqual(
            self._gen_config(chart_type='table'),
            {'type': 'table'}
        )

        self.assertConfigEqual(
            self._gen_config(title='Test Title'),
            {'title': {'text': 'Test Title'}}
        )

        self.assertConfigEqual(
            self._gen_config(subtitle='Test Subtitle'),
            {'subtitle': {'text': 'Test Subtitle'}}
        )

        self.assertConfigEqual(
            self._gen_config(timezone_offset=660),
            {'time': {
                'timezoneOffset': 660,
                'useUTC': True
            }}
        )

        self.assertConfigEqual(
            self._gen_config(use_utc=False),
            {'time': {'useUTC': False}}
        )

        self.assertConfigEqual(
            self._gen_config(height=400),
            {'chart': {'height': 400}}
        )

        self.assertConfigEqual(
            self._gen_config(legend_title='Test Legend'),
            {'legend': {
                'enabled': True,
                'title': {'text': 'Test Legend'}
            }}
        )

        self.assertConfigEqual(
            self._gen_config(
                tooltip_header='Tool Header {point.x}',
                tooltip_point='Tool Point {point.y}',
            ),
            {'tooltip': {
                'headerFormat': 'Tool Header {point.x}',
                'pointFormat': 'Tool Point {point.y}'
            }}
        )

        self.assertConfigEqual(
            self._gen_config(
                data_labels=True,
                colour_by_point=True,
            ),
            {'plotOptions': {
                'series': {'dataLabels': {'enabled': True}},
                'bar': {'colorByPoint': True},
                'column': {'colorByPoint': True}
            }}
        )

        self.assertConfigEqual(
            self._gen_config(
                data_labels=False,
                colour_by_point=False,
            ),
            {'plotOptions': {
                'series': {'dataLabels': {'enabled': False}},
                'bar': {'colorByPoint': False},
                'column': {'colorByPoint': False}
            }}
        )

        self.assertConfigEqual(
            self._gen_config(full_height=True),
            {'fullHeight': True}
        )
