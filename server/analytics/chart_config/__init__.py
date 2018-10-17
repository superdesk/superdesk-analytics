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

from analytics.common import get_cv_by_qcode

from copy import deepcopy


class ChartConfig:
    """Class to generate Highcharts config"""

    defaultConfig = {
        'credits': {'enabled': False}
    }

    def __init__(self, chart_id, chart_type):
        """Initialise the data for the chart config

        :param str chart_id: The id to be given to the chart
        :param str chart_type: The qcode of the chart type to generate
        """

        self.id = chart_id
        self.config = {}
        self.title = ''
        self.subtitle = ''
        self.chart_type = chart_type
        self.sources = []
        self.sort_order = 'desc'

        self.translations = {}

    def is_multi_source(self):
        """Returns True if this chart has multiple data sources

        :return bool: True if chart has more than 1 data source
        """

        return len(self.sources) > 1

    def _get_source(self, index):
        """Returns the source's field and data attributes

        :param int index: The index of self.sources to use
        :return dict: Source's field and data attributes
        """

        try:
            source = self.sources[index]
        except IndexError:
            source = {}

        return {
            'field': source.get('field') or '',
            'data': source.get('data') or {}
        }

    def get_parent(self):
        """Returns the parent data source's field and data attributes

        :return dict: Parent field and data attributes
        """

        return self._get_source(0)

    def get_child(self):
        """Returns the child data source's field and data attributes

        :return dict: Child field and data attributes
        """

        return self._get_source(1)

    def get_title(self):
        """Generates the title string to use for the chart

        :return str: Title for the chart
        """

        return self.title

    def get_title_config(self):
        """Generates the title config to use for the chart

        :return dict: Highcharts.title config
        """

        return {'text': self.get_title()}

    def get_subtitle(self):
        """Generates the subtitle string to use for the chart

        :return str: Subtitle for the chart
        """

        return self.subtitle

    def get_subtitle_config(self):
        """Generates the subtitle config to use for the chart

        :return dict: Highcharts.subtitle config
        """

        return {'text': self.get_subtitle()}

    def get_source_name(self, field):
        """Generates the name for the given source

        :param str field: The field attribute of the source, i.e. anpa_category.qcode
        :return str: Data source name
        """
        return self._get_translation_title(field)

    def get_x_axis_config(self):
        """Generates the title and categories config for the X Axis

        :return dict: Highcharts.xAxis config
        """

        parent = self.get_parent()
        return {
            'title': {'text': self.get_x_axis_title()},
            'categories': self.get_source_titles(
                parent['field'],
                self.get_sorted_keys(parent['data'])
            )
        }

    def get_x_axis_title(self):
        """Generates the title for the X Axis (defaults to primary data field name)

        :return str: The title for the X Axis
        """

        parent = self.get_parent()
        return self.get_source_name(parent['field'])

    def get_y_axis_config(self):
        """Generates the title and stack config for the Y Axis

        :return dict: Highcharts.yAxis config
        """

        return {
            'title': {'text': self.get_y_axis_title()},
            'stackLabels': {'enabled': self.is_multi_source()},
            'allowDecimals': False
        }

    def get_y_axis_title(self):
        """Generates the title for the Y Axis (defaults to 'Published Stories')

        :return str: The title for the Y Axis
        """

        return 'Published Stories'

    def get_source_titles(self, field, keys):
        """Generates the list of titles used for the data sources

        :param str field: The field attribute of the source (i.e. anpa_category.qcode)
        :param list[str] keys: An array of key values for the data sources
        :return list[str]: Names of the source data
        """
        names = self._get_translation_names(field)
        return [
            names.get(qcode) or qcode
            for qcode in keys
        ]

    def get_source_title(self, field, qcode):
        """Generates the name for the specific data source

        :param str field: The field attribute of the source (i.e. anpa_category.qcode)
        :param str qcode: The key value for the specific data source
        :return str: Name of the source type
        """
        return self._get_translation_names(field).get(qcode) or qcode

    def get_sorted_keys(self, data):
        """Generates array of keys based on sorting of the data (using this.sortOrder)

        :param dict data: The source data to get the keys for
        :return list: Key names
        """

        return self.get_single_sorted_keys(data) if not self.is_multi_source() \
            else self.get_multi_sorted_keys(data)

    def get_single_sorted_keys(self, data):
        """Generates array of keys for single series data

        :param dict data: The source data to get the keys for
        :return list: Key names
        """

        return [
            category for category, count
            in sorted(
                data.items(),
                key=lambda kv: kv[1] if self.sort_order == 'asc' else -kv[1]
            )
        ]

    def get_multi_sorted_keys(self, data):
        """Generates array of keys for stacked series data

        :param dict data:
        :return list: Key names
        """

        return [
            category for category, count
            in sorted(
                data.items(),
                key=lambda kv: sum(kv[1].values()) if self.sort_order == 'asc'
                else -sum(kv[1].values())
            )
        ]

    def get_series_data(self):
        """Generates the Highcharts config for the series data

        :return dict: Highcharts.series config
        """

        return self.get_single_series_data() if not self.is_multi_source() \
            else self.get_multi_series_data()

    def get_single_series_data(self):
        """Generates the name and data attributes for single series data

        :return dict: Highcharts.series config for a single series
        """

        parent = self.get_parent()

        return [{
            'name': self.get_y_axis_title(),
            'data': [parent['data'][key] for key in self.get_sorted_keys(parent['data'])]
        }]

    def get_multi_series_data(self):
        """Generates the name and data attributes for stacked series data

        :return dict: Highcharts.series config for stacked series
        """

        parent = self.get_parent()
        child = self.get_child()

        series = []

        for childKey in child['data'].keys():
            series.append({
                'name': str(self.get_source_title(child['field'], childKey)),
                'data': [
                    counts.get(childKey) or 0
                    for counts in [
                        parent['data'][key] for key in self.get_sorted_keys(parent['data'])
                    ]
                ]
            })

        return series

    def get_legend(self):
        """Generates the config for the Highcharts legend

        :return dict: Highcharts.legend config
        """

        if not self.is_multi_source():
            return {'enabled': False}

        child = self.get_child()

        return {
            'enabled': True,
            'title': {'text': self.get_source_name(child['field'])}
        }

    def get_plot_options(self):
        """Generates the config for the Highcharts plot options

        :return dict: Highcharts.plotOptions config
        """

        if not self.is_multi_source():
            return {
                'bar': {
                    'colorByPoint': True,
                    'dataLabels': {'enabled': True}
                },
                'column': {
                    'colorByPoint': True,
                    'dataLabels': {'enabled': True}
                }
            }

        return {
            'bar': {
                'stacking': 'normal',
                'colorByPoint': False
            },
            'column': {
                'stacking': 'normal',
                'colorByPoint': False
            }
        }

    def get_tooltip(self):
        """Generates the config for the Highcharts tooltip options

        :return dict: Highcharts.tooltip config
        """

        return {
            'headerFormat': '{point.x}: {point.y}',
            'pointFormat': ''
        } if not self.is_multi_source() else {
            'headerFormat': '{series.name}/{point.x}: {point.y}',
            'pointFormat': ''
        }

    def get_chart(self):
        """Generates the type and zoomType config for the Highcharts chart options

        :return dict: Highcharts.chart config
        """

        return {
            'type': self.chart_type,
            'zoomType': 'y' if self.chart_type == 'bar' else 'x'
        }

    def add_source(self, field, data):
        """Adds the provided sources field and data to this chart config

        :param str field: The sources field attribute (i.e. anpa_category.qcode)
        :param dict data: A dictionary containing the source data
        """

        self.sources.append({
            'field': field,
            'data': data
        })

    def gen_highcharts_config(self):
        """Generates and returns the Highcharts config

        :return dict: Highcharts config
        """

        return {
            'id': self.id,
            'type': self.chart_type,
            'chart': self.get_chart(),
            'title': self.get_title_config(),
            'subtitle': self.get_subtitle_config(),
            'xAxis': self.get_x_axis_config(),
            'yAxis': self.get_y_axis_config(),
            'legend': self.get_legend(),
            'tooltip': self.get_tooltip(),
            'plotOptions': self.get_plot_options(),
            'series': self.get_series_data()
        }

    def gen_single_table_config(self):
        """Generates and returns config for a single column table

        :return dict: Single column table config
        """

        x_axis = self.get_x_axis_config()
        series_data = self.get_series_data()

        headers = [x_axis['title']['text'], 'Published Stories']
        table_rows = []
        parent = self.get_parent()

        for group in self.get_sorted_keys(parent['data']) or []:
            table_rows.append([
                self.get_source_title(parent['field'], group),
                parent['data'].get(group) or 0
            ])

        return {
            'id': self.id,
            'type': 'table',
            'chart': {'type': 'column'},
            'xAxis': x_axis,
            'series': series_data,
            'headers': headers,
            'rows': table_rows,
            'title': self.get_title(),
            'subtitle': self.get_subtitle()
        }

    def gen_multi_table_config(self):
        """Generates and returns config for a double column table

        :return dict: Double column table config
        """

        x_axis = self.get_x_axis_config()
        series_data = self.get_series_data()
        parent = self.get_parent()

        headers = [x_axis['title']['text']]
        headers.extend([series['name'] for series in series_data])
        headers.append('Total Stories')

        table_rows = [
            [self.get_source_title(parent['field'], group)]
            for group in self.get_sorted_keys(parent['data']) or []
        ]

        for series in series_data:
            for index, count in enumerate(series['data'], start=0):
                table_rows[index].append(count)

        for row in table_rows:
            row.append(
                sum(int(count) for count in row[1:])
            )

        return {
            'id': self.id,
            'type': 'table',
            'chart': {'type': 'column'},
            'xAxis': x_axis,
            'series': series_data,
            'headers': headers,
            'rows': table_rows,
            'title': self.get_title(),
            'subtitle': self.get_subtitle()
        }

    def gen_table_config(self):
        """Generates and returns config for either a single or double column table

        :return dict: Table config for either single or double column
        """

        return self.gen_single_table_config() if not self.is_multi_source() \
            else self.gen_multi_table_config()

    def gen_config(self):
        """High level function to generates the Highcharts/Table config based on chart options

        :return dict: Highchart or Table config
        """
        self.config = deepcopy(ChartConfig.defaultConfig)

        self.load_translations()

        if self.chart_type == 'table':
            self.config.update(self.gen_table_config())
        else:
            self.config.update(self.gen_highcharts_config())

        return self.config

    def load_translations(self, parent_field=None, child_field=None):
        """Loads data for translating id/qcode to display names

        :param str parent_field: Name of the first field (defaults to Parent)
        :param str child_field: Name of the second field (defaults to Child)
        """
        if parent_field is None:
            parent = self.get_parent()
            parent_field = parent['field']

        if child_field is None:
            child = self.get_child()
            child_field = child['field']

        def load_translations_for_field(field):
            if field == 'task.desk':
                self.translations[field] = {
                    'title': 'Desk',
                    'names': {
                        str(desk.get('_id')): desk.get('name')
                        for desk in list(get_resource_service('desks').get(req=None, lookup={}))
                    }
                }
            elif field == 'task.user':
                self.translations[field] = {
                    'title': 'User',
                    'names': {
                        str(user.get('_id')): user.get('display_name')
                        for user in list(get_resource_service('users').get(req=None, lookup={}))
                    }
                }
            elif field == 'anpa_category.qcode':
                self.translations[field] = {
                    'title': 'Category',
                    'names': get_cv_by_qcode('categories', 'name')
                }
            elif field == 'genre.qcode':
                self.translations[field] = {
                    'title': 'Genre',
                    'names': get_cv_by_qcode('genre', 'name')
                }
            elif field == 'urgency':
                self.translations[field] = {
                    'title': 'Urgency',
                    'names': get_cv_by_qcode('urgency', 'name')
                }
            elif field == 'state':
                self.translations[field] = {
                    'title': 'State',
                    'names': {
                        'published': 'Published',
                        'killed': 'Killed',
                        'corrected': 'Corrected',
                        'updated': 'Updated'
                    }
                }
            elif field == 'source':
                self.translations[field] = {'title': 'Source'}

        load_translations_for_field(parent_field)
        load_translations_for_field(child_field)

    def _get_translations(self, field):
        return self.translations.get(field) or {}

    def _get_translation_title(self, field):
        return self._get_translations(field).get('title') or field

    def _get_translation_names(self, field):
        return self._get_translations(field).get('names') or {}
