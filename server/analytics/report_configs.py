# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
#  Copyright 2019 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from copy import deepcopy

from superdesk.resource import Resource
from superdesk import Service, get_resource_service
from superdesk.utils import ListCursor

from analytics.common import registered_reports, DATE_FILTERS, CHART_TYPES, REPORT_CONFIG


class ReportConfigsResource(Resource):
    endpoint_name = resource_title = 'report_configs'
    schema = {
        '_id': {
            'type': 'string',
            'required': True,
            'minlength': 1
        },
        'name': {'type': 'string'},
        'enabled': {
            'type': 'boolean',
            'default': True
        },
        REPORT_CONFIG.DATE_FILTERS: {'type': 'dict'},
        REPORT_CONFIG.CHART_TYPES: {'type': 'dict'},
        REPORT_CONFIG.DEFAULT_PARAMS: {'type': 'dict'}
    }


base_config = {
    REPORT_CONFIG.CHART_TYPES: {
        CHART_TYPES.BAR: {'enabled': True},
        CHART_TYPES.COLUMN: {'enabled': True},
        CHART_TYPES.TABLE: {'enabled': True},
        CHART_TYPES.AREA: {'enabled': False},
        CHART_TYPES.LINE: {'enabled': False},
        CHART_TYPES.PIE: {'enabled': False},
        CHART_TYPES.SCATTER: {'enabled': False},
        CHART_TYPES.SPLINE: {'enabled': False}
    },
    REPORT_CONFIG.DEFAULT_PARAMS: {},
    REPORT_CONFIG.DATE_FILTERS: {
        # ABSOLUTE
        DATE_FILTERS.RANGE: {'enabled': True},
        DATE_FILTERS.DAY: {'enabled': True},

        # HOURS
        DATE_FILTERS.RELATIVE_HOURS: {
            'enabled': True,
            'max': 72
        },

        # DAYS
        DATE_FILTERS.RELATIVE_DAYS: {
            'enabled': True,
            'max': 31
        },
        DATE_FILTERS.YESTERDAY: {'enabled': True},
        DATE_FILTERS.TODAY: {'enabled': True},

        # WEEKS
        DATE_FILTERS.RELATIVE_WEEKS: {
            'enabled': True,
            'max': 52
        },
        DATE_FILTERS.LAST_WEEK: {'enabled': True},
        DATE_FILTERS.THIS_WEEK: {'enabled': True},

        # MONTHS
        DATE_FILTERS.RELATIVE_MONTHS: {
            'enabled': True,
            'max': 12
        },
        DATE_FILTERS.LAST_MONTH: {'enabled': True},
        DATE_FILTERS.THIS_MONTH: {'enabled': True},

        # YEARS
        DATE_FILTERS.LAST_YEAR: {'enabled': True},
        DATE_FILTERS.THIS_YEAR: {'enabled': True}
    }
}


class ReportConfigsService(Service):
    def get(self, req, lookup):
        configs = list(super().get(req, lookup))
        merged_configs = []

        for report_id, endpoint in registered_reports.items():
            service = get_resource_service(endpoint)
            default_config = deepcopy(getattr(service, 'defaultConfig', {}))

            for key, val in base_config.items():
                if key not in default_config:
                    default_config[key] = val

            config = next((
                c for c in configs
                if c.get('_id') == report_id
            ), None)

            if config is None:
                default_config['_id'] = report_id
                merged_configs.append(default_config)
            else:
                self.merge_config(config, default_config)
                merged_configs.append(config)

        return ListCursor(merged_configs)

    def merge_config(self, config, default_config):
        """Merge the default config and config from mongo

        Attributes that are not in the default values will be omitted
        This is how you define if a particular filter/chart type is supported
        """
        updated_config = deepcopy(default_config)
        updated_config.setdefault('date_filters', {})
        updated_config.setdefault('chart_types', {})

        new_date_filters = config.get('date_filters') or {}
        new_chart_types = config.get('chart_types') or {}

        for key, value in default_config['date_filters'].items():
            updated_config['date_filters'][key] = new_date_filters.get(key) or value

        for key, value in default_config['chart_types'].items():
            updated_config['chart_types'][key] = new_chart_types.get(key) or value

        config['date_filters'] = updated_config['date_filters']
        config['chart_types'] = updated_config['chart_types']
        config['default_params'] = config.get('default_params') or default_config['default_params']
