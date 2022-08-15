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


class SDChartAxisTestCase(TestCase):
    def setUp(self):
        self.maxDiff = None

    def _gen_config(self, **axis_config):
        chart = SDChart.Chart("test_chart")

        chart.add_axis().set_options(**axis_config)

        return chart.gen_config()

    def assertConfigEqual(self, generated, expected):
        for key, val in expected.items():
            self.assertEqual(val, generated.get(key))

    def test_default_config(self):
        self.assertConfigEqual(
            self._gen_config(),
            {
                "xAxis": [{"type": "linear", "allowDecimals": False}],
                "yAxis": [{"allowDecimals": False}],
                "series": [],
            },
        )

    def test_set_options(self):
        self.assertConfigEqual(
            self._gen_config(type="datetime"),
            {"xAxis": [{"type": "datetime", "allowDecimals": False}]},
        )

        self.assertConfigEqual(self._gen_config(default_chart_type="column"), {"chart": {"zoomType": "x"}})

        self.assertConfigEqual(self._gen_config(default_chart_type="bar"), {"chart": {"zoomType": "y"}})

        self.assertConfigEqual(
            self._gen_config(categories=["cat1", "cat2", "cat3"]),
            {
                "xAxis": [
                    {
                        "type": "linear",
                        "allowDecimals": False,
                        "categories": ["cat1", "cat2", "cat3"],
                    }
                ]
            },
        )

        self.assertConfigEqual(
            self._gen_config(allow_decimals=True),
            {
                "xAxis": [{"type": "linear", "allowDecimals": True}],
                "yAxis": [{"allowDecimals": True}],
            },
        )

        self.assertConfigEqual(
            self._gen_config(stack_labels=True),
            {"yAxis": [{"allowDecimals": False, "stackLabels": {"enabled": True}}]},
        )

        self.assertConfigEqual(
            self._gen_config(x_title="Test X Title"),
            {
                "xAxis": [
                    {
                        "type": "linear",
                        "allowDecimals": False,
                        "title": {"text": "Test X Title"},
                    }
                ]
            },
        )

        self.assertConfigEqual(
            self._gen_config(y_title="Test Y Title"),
            {"yAxis": [{"allowDecimals": False, "title": {"text": "Test Y Title"}}]},
        )

    def test_translate_categories(self):
        chart = SDChart.Chart("test_chart")

        chart.set_translation(
            "categories",
            "Category",
            {"a": "Advisories", "b": "Basketball", "c": "Cricket"},
        )

        chart.add_axis().set_options(
            type="category",
            categories=["b", "c", "a"],
            category_field="categories",
            x_title=chart.get_translation_title("categories"),
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
                ]
            },
        )
