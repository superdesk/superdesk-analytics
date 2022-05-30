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


class SDChartSeriesTestCase(TestCase):
    def setUp(self):
        self.maxDiff = None

    def _gen_config(self, axis_config, series_config):
        chart = SDChart.Chart("test_chart")

        axis = chart.add_axis().set_options(**axis_config)

        if isinstance(series_config, list):
            for series in series_config:
                axis.add_series().set_options(**series)
        else:
            axis.add_series().set_options(**series_config)

        return chart.gen_config()

    def assertConfigEqual(self, generated, expected):
        for key, val in expected.items():
            self.assertEqual(val, generated.get(key))

    def test_default_config(self):
        self.assertConfigEqual(
            self._gen_config({}, {}), {"series": [{"xAxis": 0, "type": "bar"}]}
        )

        self.assertConfigEqual(
            self._gen_config({"default_chart_type": "column"}, {}),
            {"series": [{"xAxis": 0, "type": "column"}]},
        )

        self.assertConfigEqual(
            self._gen_config({"index": 1}, {}),
            {"series": [{"xAxis": 1, "type": "bar"}]},
        )

    def test_add_multiple_series(self):
        self.assertConfigEqual(
            self._gen_config({}, [{}, {}]),
            {"series": [{"xAxis": 0, "type": "bar"}, {"xAxis": 0, "type": "bar"}]},
        )

        self.assertConfigEqual(
            self._gen_config({}, [{"type": "column"}, {"type": "line"}]),
            {"series": [{"xAxis": 0, "type": "column"}, {"xAxis": 0, "type": "line"}]},
        )

        self.assertConfigEqual(
            self._gen_config(
                {},
                [
                    {"stack": 0, "stack_type": "normal"},
                    {"stack": 0, "stack_type": "normal"},
                ],
            ),
            {
                "series": [
                    {"xAxis": 0, "type": "bar", "stack": 0, "stacking": "normal"},
                    {"xAxis": 0, "type": "bar", "stack": 0, "stacking": "normal"},
                ]
            },
        )

    def test_series_data(self):
        self.assertConfigEqual(
            self._gen_config({}, {"name": "Test Data", "data": [5, 2, 8, 1]}),
            {
                "series": [
                    {
                        "xAxis": 0,
                        "type": "bar",
                        "name": "Test Data",
                        "data": [5, 2, 8, 1],
                    }
                ]
            },
        )

        self.assertConfigEqual(
            self._gen_config(
                {},
                [
                    {"name": "Test Data 1", "data": [5, 2, 8, 1]},
                    {"name": "Test Data 2", "data": [3, 1, 18, 3]},
                ],
            ),
            {
                "series": [
                    {
                        "xAxis": 0,
                        "type": "bar",
                        "name": "Test Data 1",
                        "data": [5, 2, 8, 1],
                    },
                    {
                        "xAxis": 0,
                        "type": "bar",
                        "name": "Test Data 2",
                        "data": [3, 1, 18, 3],
                    },
                ]
            },
        )

    def test_category_based_config(self):
        self.assertConfigEqual(
            self._gen_config(
                {"categories": ["b", "c", "a"]},
                {"name": "Test Data", "data": {"a": 2, "b": 6, "c": 10}},
            ),
            {
                "series": [
                    {"xAxis": 0, "type": "bar", "name": "Test Data", "data": [6, 10, 2]}
                ]
            },
        )

        chart = SDChart.Chart("test_chart")

        chart.set_translation(
            "categories",
            "Category",
            {"a": "Advisories", "b": "Basketball", "c": "Cricket"},
        )

        axis = chart.add_axis().set_options(
            type="category",
            categories=["b", "c", "a"],
            category_field="categories",
            x_title=chart.get_translation_title("categories"),
        )

        axis.add_series().set_options(
            field="categories", data={"a": 2, "b": 6, "c": 10}
        )

        self.assertConfigEqual(
            chart.gen_config(),
            {
                "xAxis": [
                    {
                        "type": "category",
                        "allowDecimals": False,
                        "categories": ["Basketball", "Cricket", "Advisories"],
                        "title": {"text": "Category"},
                    }
                ],
                "series": [
                    {"xAxis": 0, "type": "bar", "name": "Category", "data": [6, 10, 2]}
                ],
            },
        )
