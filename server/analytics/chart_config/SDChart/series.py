# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


class Series:
    """Class instance for adding a series to an axis"""

    def __init__(self, axis):
        """Sets the initial data for the series

        :param analytics.chart_config.SDChart.Axis axis: The parent Axis instance
        """

        self.axis = axis
        self.chart = self.axis.chart

        self.type = None
        self.data = None
        self.field = None
        self.name = None
        self.stack = None
        self.stack_type = None

    def set_options(self, **kwargs):
        """Sets the options for the series

        kwargs:
            - ``type (str=self.axis.default_chart_type)``: The chart type
            - ``data (dict, list)``: The data to add to the series
            - ``field (str)``: The field type for the data
            - ``name (str)``: The field name for the data
            - ``stack (int)``: The stack number
            - ``stack_type (str)``: The type of stacking to perform
        """
        for key, value in kwargs.items():
            self.__dict__[key] = value

        return self

    def get_data(self):
        """Returns the data for this series"""

        if self.data is None:
            return None
        elif isinstance(self.data, list):
            return self.data
        elif isinstance(self.data, dict):
            if self.axis.categories is not None:
                return [
                    self.data.get(source) or 0
                    for source in self.axis.categories
                ]

            return [
                item.get(source) or 0
                for item, source in self.data.items()
            ]

        return None

    def get_name(self):
        """Returns the name of the field type"""

        if self.field is None:
            return self.name
        elif self.name is not None:
            name = (self.chart.get_translation_names(self.field) or {}).get(self.name) or self.name
        else:
            name = self.chart.get_translation_title(self.field) or self.name

        return str(name or self.field)

    def gen_config(self, config):
        """Sets the series config for the axis"""

        series = {
            'xAxis': self.axis.index,
            'type': self.type or self.axis.default_chart_type or 'bar'
        }
        name = self.get_name()
        data = self.get_data()

        if name is not None:
            series['name'] = name

        if data is not None:
            series['data'] = data

        if self.stack is not None:
            series['stacking'] = self.stack_type or 'normal'
            series['stack'] = self.stack

        if self.axis.point_start is not None:
            series['pointStart'] = self.axis.point_start

        if self.axis.point_interval is not None:
            series['pointInterval'] = self.axis.point_interval

        return series
