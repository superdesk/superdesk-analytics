# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2018 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from .axis import Axis

from copy import deepcopy


class Chart:
    """Class instance for generating a config for use with Highcharts"""

    def __init__(self, chart_id, **kwargs):
        """Initialise the data for the chart config

        kwargs:
            - ``chart_id (str)``: the id to be given to the chart
            - ``title (str)``: the title of the chart
            - ``subtitle (str)``:  The subtitle of the chart
            - ``start_of_week (int)``: The starting day of the week (0=Sunday, 6=Saturday)
            - ``timezone_offset (int)``:  The UTC offset in minutes for the timezone to use
            - ``use_utc (bool=True)``:  Use UTC in the datetime fields
            - ``height (int)``:  The height of the chart
            - ``legend_title (str)``: The title for the legend
            - ``tooltip_header (str)``: The tooltip header format
            - ``tooltip_pointer (str)``: The tooltip point format
            - ``data_labels (bool=False)``: Enable/Disable data labels
            - ``data_label_format (str)``: Data label format
            - ``colour_by_point (bool=False)``: One colour per series or one colour per point
            - ``full_height (bool=False)``: Forces the chart to render full height
            - ``default_config (dict={})``: Default config options for this chart
            - ``zoom_type (str)``: The zoom type applied to highcharts
            - ``translations (dict={})``: Field name & values translations
        """

        self.id = chart_id
        self.chart_type = 'highcharts'
        self.use_utc = True
        self.data_labels = False
        self.full_height = False

        self.axis = []
        self.config = {}
        self.translations = {}
        self.default_config = {}

        self.title = None
        self.subtitle = None
        self.start_of_week = None
        self.timezone_offset = None
        self.height = None
        self.tooltip_header = None
        self.tooltip_point = None
        self.legend_title = None
        self.colour_by_point = None
        self.zoom_type = None
        self.data_label_format = None

        self.set_options(**kwargs)

    def set_options(self, **kwargs):
        """Sets the options for the chart"""

        for key, value in kwargs.items():
            self.__dict__[key] = value

        return self

    def get_title(self):
        """Returns the title string to use for the chart"""

        return self.title

    def gen_title_config(self, config):
        """Sets the title config to use for the chart"""

        title = self.get_title()

        if title is not None:
            if 'title' not in config:
                config['title'] = {}
            config['title']['text'] = title

        return config

    def get_subtitle(self):
        """Returns the subtitle string to use for the chart"""

        return self.subtitle

    def gen_subtitle_config(self, config):
        """Sets the subtitle config to use for the chart"""

        subtitle = self.get_subtitle()

        if subtitle is not None:
            if 'subtitle' not in config:
                config['subtitle'] = {}
            config['subtitle']['text'] = subtitle

        return config

    def gen_legend_config(self, config):
        """Sets the legend config to use for the chart"""

        if 'legend' not in config:
            config['legend'] = {}

        if self.legend_title is None:
            config['legend']['enabled'] = False
        else:
            config['legend']['enabled'] = True
            config['legend']['title'] = {'text': self.legend_title}

        return config

    def gen_tooltip_config(self, config):
        """Sets the tooltip config to use for the chart"""

        if 'tooltip' not in config:
            config['tooltip'] = {}

        if self.tooltip_header is not None:
            config['tooltip']['headerFormat'] = self.tooltip_header

        if self.tooltip_point is not None:
            config['tooltip']['pointFormat'] = self.tooltip_point

        return config

    def gen_plot_config(self, config):
        """Sets the plot options config to use for the chart"""

        if 'plotOptions' not in config:
            config['plotOptions'] = {}

        if self.data_labels is not None:
            if 'series' not in config['plotOptions']:
                config['plotOptions']['series'] = {}

            if 'dataLabels' not in config['plotOptions']['series']:
                config['plotOptions']['series']['dataLabels'] = {}

            config['plotOptions']['series']['dataLabels']['enabled'] = self.data_labels

            if self.data_label_format:
                config['plotOptions']['series']['dataLabels']['format'] = self.data_label_format

        if self.colour_by_point is not None:
            if 'bar' not in config['plotOptions']:
                config['plotOptions']['bar'] = {}

            if 'column' not in config['plotOptions']:
                config['plotOptions']['column'] = {}

            config['plotOptions']['bar']['colorByPoint'] = self.colour_by_point
            config['plotOptions']['column']['colorByPoint'] = self.colour_by_point

        return config

    def add_axis(self):
        """Add a new Axis to this chart"""

        axis = Axis(self)
        self.axis.append(axis)
        return axis

    def gen_chart_config(self, config):
        """Generates the chart config"""

        if 'chart' not in config:
            config['chart'] = {}

        if self.height is not None:
            config['chart']['height'] = self.height

        if self.full_height is not None:
            config['fullHeight'] = self.full_height

        if len(self.axis) < 1 or len(self.axis) > 1:
            return config

        if self.zoom_type is not None:
            config['chart']['zoomType'] = self.zoom_type
        elif len(self.axis) > 0:
            chart_type = self.axis[0].default_chart_type
            config['chart']['zoomType'] = 'y' if chart_type == 'bar' else 'x'

        return config

    def gen_time_config(self, config):
        """Generates the time config to use for the chart"""

        if 'time' not in config:
            config['time'] = {}

        if self.use_utc is not None:
            config['time']['useUTC'] = self.use_utc

        if self.timezone_offset is not None:
            config['time']['timezoneOffset'] = self.timezone_offset

        return config

    def gen_highcharts_config(self, config):
        """Generates the config for use with highcharts"""

        config['id'] = self.id
        config['type'] = self.chart_type

        self.gen_chart_config(config)
        self.gen_title_config(config)
        self.gen_subtitle_config(config)
        self.gen_time_config(config)
        self.gen_legend_config(config)
        self.gen_tooltip_config(config)
        self.gen_plot_config(config)

        for axis in self.axis:
            axis.gen_config(config)

        return config

    def gen_single_table_config(self, config):
        """Generates the single table config"""

        axis = self.axis[0]
        headers = [axis.x_title, axis.y_title]
        rows = []

        index = 0
        for category in axis.get_categories():
            rows.append([
                category,
                axis.series[0].data[index]
            ])

            index += 1

        return {
            'id': self.id,
            'type': self.chart_type,
            'chart': {'type': 'column'},
            'xAxis': config['xAxis'],
            'series': config['series'],
            'headers': headers,
            'rows': rows,
            'title': self.get_title(),
            'subtitle': self.get_subtitle()
        }

    def gen_multi_table_config(self, config):
        """Generates the multi table config"""

        axis = self.axis[0]
        headers = [axis.x_title]
        headers.extend([
            series.get_name()
            for series in axis.series
        ])
        headers.append('Total Stories')

        rows = [
            [category]
            for category in axis.get_categories()
        ]

        for series in axis.series:
            index = 0

            for count in series.get_data():
                rows[index].append(count)

                index += 1

        for row in rows:
            row.append(
                sum(int(count) for count in row[1:])
            )

        return {
            'id': self.id,
            'type': self.chart_type,
            'chart': {'type': 'column'},
            'xAxis': config['xAxis'],
            'series': config['series'],
            'headers': headers,
            'rows': rows,
            'title': self.get_title(),
            'subtitle': self.get_subtitle()
        }

    def gen_table_config(self, config):
        """Generates the table config"""

        self.gen_highcharts_config(config)

        if len(self.axis) == 1:
            if len(self.axis[0].series) == 1:
                self.config = self.gen_single_table_config(config)
            else:
                self.config = self.gen_multi_table_config(config)

    def gen_config(self):
        """Generates the config for this chart"""

        self.config = deepcopy(self.default_config)

        if self.chart_type == 'table':
            self.gen_table_config(self.config)
        else:
            self.gen_highcharts_config(self.config)

        return self.config

    def set_translation(self, field, title, names=None):
        """Saves the provided field translations

        :param str field: The name of the field for this translation
        :param str title: The title of the field name
        :param dict names: Map of id/qcode to display names
        """

        self.translations[field.replace('.', '_')] = {
            'title': title,
            'names': names or {}
        }

    def get_translation(self, field):
        """Helper function to get the translations for a field

        :param str field: Name of the field to get translations for
        """

        return self.translations[(field or '').replace('.', '_')] or {}

    def get_translation_title(self, field):
        """Helper function to get the translated title for a field

        :param str field: Name of the field to get translated title for
        """

        return self.get_translation(field).get('title') or field

    def get_translation_names(self, field):
        """Helper function to get the translated title for a field

        :param str field: Name of the field to get translated title for
        """

        return self.get_translation(field).get('names') or {}
