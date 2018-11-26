# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .series import Series


class Axis:
    """Class instance for adding an Axis with series of data to a chart"""

    def __init__(self, chart):
        """Sets the initial data for the axis

        :param analytics.chart_config.SDChart.Chart chart: The parent Chart instance
        """

        self.chart = chart
        self.type = 'linear'
        self.index = 0
        self.allow_decimals = False
        self.series = []

        self.default_chart_type = None
        self.categories = None
        self.category_field = None
        self.point_start = None
        self.point_interval = None
        self.stack_labels = None
        self.y_title = None
        self.x_title = None

    def set_options(self, **kwargs):
        """Sets the options for the axis

        kwargs:
            - ``type (str='linear')``: The Axis type, i.e. linear, logarithmic, datetime or category
            - ``default_chart_type (str)``: The default chart type for child series
            - ``index (int=0)``: The Axis index assigned by parent chart
            - ``category_field (str)``: Field used to translate category names
            - ``categories (list)``:  The list of categories
            - ``allow_decimals (bool=False)``: Use whole number on this axis
            - ``point_start (int)``: The starting point
            - ``point_interval (int)``: The intervals between points
            - ``stack_labels (bool)``: If true, then place labels at the top of stack
            - ``y_title (str)``: The title used on the y-axis
            - ``x_title (str)``: The title used on the x-axis
        """
        for key, value in kwargs.items():
            self.__dict__[key] = value

        return self

    def add_series(self):
        """Add a new data series to this axis sources"""

        series = Series(self)
        self.series.append(series)
        return series

    def get_categories(self):
        """Returns translated category field names"""

        if self.categories is not None and self.category_field is not None:
            names = self.chart.get_translation_names(self.category_field)

            return [
                names.get(category) or category
                for category in self.categories
            ]

        return self.categories

    def gen_x_axis_config(self, config):
        """Generate the x-axis config"""

        axis_config = {'type': self.type}

        if self.categories is not None:
            axis_config['categories'] = self.get_categories()

        if self.allow_decimals is not None:
            axis_config['allowDecimals'] = self.allow_decimals

        if self.chart.start_of_week is not None:
            axis_config['startOfWeek'] = self.chart.start_of_week

        if self.x_title is not None:
            axis_config['title'] = {'text': self.x_title}

        return axis_config

    def gen_y_axis_config(self, config):
        """Generate the y-axis config"""

        axis_config = {}

        if self.allow_decimals is not None:
            axis_config['allowDecimals'] = self.allow_decimals

        if self.stack_labels is not None:
            axis_config['stackLabels'] = {'enabled': self.stack_labels}

        if self.y_title is not None:
            axis_config['title'] = {'text': self.y_title}

        return axis_config

    def gen_config(self, config):
        """Generate the config"""

        if not config.get('xAxis'):
            config['xAxis'] = []

        config['xAxis'].append(self.gen_x_axis_config(config))

        if not config.get('yAxis'):
            config['yAxis'] = []

        config['yAxis'].append(self.gen_y_axis_config(config))

        if not config.get('series'):
            config['series'] = []

        for series in self.series:
            config['series'].append(series.gen_config(config))

        return config
