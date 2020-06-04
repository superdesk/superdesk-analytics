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

from analytics.common import get_cv_by_qcode, DATE_FILTERS
from analytics.chart_config import SDChart
from analytics.stats.common import OPERATION_NAMES

from datetime import datetime, timedelta


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

    def get_subtitle(self):
        """Generates the subtitle string to use for the chart

        :return str: Subtitle for the chart
        """

        return self.subtitle

    def get_source_name(self, field):
        """Generates the name for the given source

        :param str field: The field attribute of the source, i.e. anpa_category.qcode
        :return str: Data source name
        """
        return self._get_translation_title(field)

    def get_y_axis_title(self):
        """Generates the title for the Y Axis (defaults to 'Published Stories')

        :return str: The title for the Y Axis
        """

        return 'Published Stories'

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
        config_type = 'table' if self.chart_type == 'table' else 'highcharts'
        chart = SDChart.Chart(
            self.id,
            chart_type=config_type,
            title=self.get_title(),
            subtitle=self.get_subtitle(),
            default_config=self.defaultConfig
        )

        chart.translations = self.translations
        chart.tooltip_point = ''

        parent = self.get_parent()

        axis_options = {
            'type': 'category',
            'default_chart_type': 'column' if self.chart_type == 'table' else self.chart_type,
            'y_title': self.get_y_axis_title(),
            'x_title': chart.get_translation_title(parent['field']),
            'category_field': parent['field'],
            'categories': self.get_sorted_keys(parent['data']),
        }

        if not self.is_multi_source():
            chart.tooltip_header = '{point.x}: {point.y}'
            chart.data_labels = True
            chart.colour_by_point = True
            axis_options['stack_labels'] = False

            axis = chart.add_axis() \
                .set_options(**axis_options)

            axis.add_series().set_options(
                field=parent['field'],
                data=[
                    parent['data'][key]
                    for key in self.get_sorted_keys(parent['data'])
                ]
            )
        else:
            child = self.get_child()
            chart.legend_title = self.get_source_name(child['field'])
            chart.tooltip_header = '{series.name}/{point.x}: {point.y}'
            chart.data_labels = False
            chart.colour_by_point = False
            axis_options['stack_labels'] = True

            axis = chart.add_axis() \
                .set_options(**axis_options)

            for child_key in child['data'].keys():
                axis.add_series().set_options(
                    field=child['field'],
                    name=child_key,
                    stack=0,
                    stackType='normal',
                    data=[
                        counts.get(child_key) or 0
                        for counts in [
                            parent['data'][key] for key in self.get_sorted_keys(parent['data'])
                        ]
                    ]
                )

        return chart.gen_config()

    def gen_config(self):
        """High level function to generates the Highcharts/Table config based on chart options

        :return dict: Highchart or Table config
        """
        self.load_translations()
        self.config = self.gen_highcharts_config()

        return self.config

    @staticmethod
    def get_translations(fields):
        chart = ChartConfig('tmp', 'chart')
        for field in fields:
            chart.load_translations_for_field(field)
        return chart.translations

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

        self.load_translations_for_field(parent_field)
        self.load_translations_for_field(child_field)

    def load_translations_for_field(self, field):
        # If a translation for this field has already been loaded
        # then don't bother re-loading the translation for it
        if field in self.translations:
            return

        elif field == 'task.desk':
            self._set_translation(
                'task.desk',
                'Desk',
                {
                    str(desk.get('_id')): desk.get('name')
                    for desk in list(get_resource_service('desks').get(req=None, lookup={}))
                }
            )
        elif field == 'task.user':
            self._set_translation(
                'task.user',
                'User',
                {
                    str(user.get('_id')): user.get('display_name')
                    for user in list(get_resource_service('users').get(req=None, lookup={}))
                }
            )
        elif field == 'anpa_category.qcode':
            self._set_translation(
                'anpa_category.qcode',
                'Category',
                get_cv_by_qcode('categories', 'name')
            )
        elif field == 'genre.qcode':
            self._set_translation(
                'genre.qcode',
                'Genre',
                get_cv_by_qcode('genre', 'name')
            )
        elif field == 'subject.qcode':
            self._set_translation(
                'subject.qcode',
                'Subject',
                get_cv_by_qcode('subjectcodes', 'name')
            )
        elif field == 'urgency':
            self._set_translation(
                'urgency',
                'Urgency',
                get_cv_by_qcode('urgency', 'name')
            )
        elif field == 'state':
            self._set_translation(
                'state',
                'State',
                {
                    'published': 'Published',
                    'killed': 'Killed',
                    'corrected': 'Corrected',
                    'updated': 'Updated'
                }
            )
        elif field == 'source':
            self._set_translation('source', 'Source')
        elif field == 'operation':
            self._set_translation('operation', 'Operation', OPERATION_NAMES)
        elif field == 'authors.parent':
            self._set_translation(
                'authors.parent',
                'Author',
                {
                    str(user.get('_id')): user.get('display_name')
                    for user in list(get_resource_service('users').get(req=None, lookup={}))
                }
            )

    def _set_translation(self, field, title, names=None):
        """Saves the provided field translations

        :param str field: The name of the field for this translation
        :param str title: The title of the field name
        :param dict names: Map of id/qcode to display names
        """
        self.translations[field.replace('.', '_')] = {
            'title': title,
            'names': names or {}
        }

    def _get_translations(self, field):
        """Helper function to get the translations for a field

        :param str field: Name of the field to get translations for
        :return dict: Title and name translations
        """
        return self.translations.get(field.replace('.', '_')) or {}

    def _get_translation_title(self, field):
        """Helper function to get the translated title for a field

        :param str field: Name of the field to get translated title for
        :return str: Title of the field
        """
        return self._get_translations(field).get('title') or field

    def _get_translation_names(self, field):
        """Helper function to get the translated id/qcode to name map for a field

        :param str field: Name of the field to get translated names for
        :return dict: id/qcode to name map
        """
        return self._get_translations(field).get('names') or {}

    @staticmethod
    def gen_subtitle_for_dates(params):
        chart = params.get('chart') or {}

        if chart.get('subtitle'):
            return chart['subtitle']

        dates = params.get('dates') or {}
        date_filter = dates.get('filter')

        # ABSOLUTE
        if date_filter == DATE_FILTERS.RANGE:
            start = datetime.strptime(dates.get('start'), '%Y-%m-%d')
            end = datetime.strptime(dates.get('end'), '%Y-%m-%d')

            return '{} - {}'.format(
                start.strftime('%B %-d, %Y'),
                end.strftime('%B %-d, %Y')
            )
        elif date_filter == DATE_FILTERS.DAY:
            date_str = params.get('date') or dates.get('date')
            date = datetime.strptime(date_str, '%Y-%m-%d')

            return date.strftime('%A %-d %B %Y')

        # HOURS
        elif date_filter == DATE_FILTERS.RELATIVE_HOURS:
            hours = dates.get('relative')

            return 'Last {} hours'.format(hours)

        # DAYS
        elif date_filter == DATE_FILTERS.RELATIVE_DAYS:
            days = dates.get('relative')

            return 'Last {} days'.format(days)
        elif date_filter == DATE_FILTERS.YESTERDAY:
            return (datetime.today() - timedelta(days=1)) \
                .strftime('%A %-d %B %Y')
        elif date_filter == DATE_FILTERS.TODAY:
            return datetime.today().strftime('%A %-d %B %Y')

        # WEEKS
        elif date_filter == DATE_FILTERS.RELATIVE_WEEKS:
            weeks = dates.get('relative')

            return 'Last {} weeks'.format(weeks)
        elif date_filter == DATE_FILTERS.LAST_WEEK:
            week = datetime.today() - timedelta(weeks=1)
            start = week - timedelta(days=week.weekday() + 1)
            end = start + timedelta(days=6)

            return '{} - {}'.format(
                start.strftime('%B %-d, %Y'),
                end.strftime('%B %-d, %Y')
            )
        elif date_filter == DATE_FILTERS.THIS_WEEK:
            week = datetime.today()
            start = week - timedelta(days=week.weekday() + 1)
            end = start + timedelta(days=6)

            return '{} - {}'.format(
                start.strftime('%B %-d, %Y'),
                end.strftime('%B %-d, %Y')
            )

        # MONTHS
        elif date_filter == DATE_FILTERS.RELATIVE_MONTHS:
            months = dates.get('relative')

            return 'Last {} months'.format(months)
        elif date_filter == DATE_FILTERS.LAST_MONTH:
            first = datetime.today().replace(day=1)
            month = first - timedelta(days=1)

            return month.strftime('%B %Y')
        elif date_filter == DATE_FILTERS.THIS_MONTH:
            month = datetime.today()

            return month.strftime('%B %Y')

        # YEARS
        elif date_filter == DATE_FILTERS.LAST_YEAR:
            year = datetime.today() - timedelta(weeks=52)

            return year.strftime('%Y')
        elif date_filter == DATE_FILTERS.THIS_YEAR:
            year = datetime.today()

            return year.strftime('%Y')

        return None
