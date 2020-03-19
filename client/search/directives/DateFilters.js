import {appConfig} from 'superdesk-core/scripts/appConfig';

import {DATE_FILTERS} from '../common';
import {REPORT_CONFIG} from '../../services/ReportConfigService';

DateFilters.$inject = ['moment', '$interpolate', 'lodash', 'gettextCatalog'];

/**
 * @ngdoc property
 * @module superdesk.analytics.search
 * @name DEFAULT_FILTERS
 * @type {Array<String>}
 * @description Default date filters
 */
export const DEFAULT_FILTERS = [
    DATE_FILTERS.YESTERDAY,
    DATE_FILTERS.LAST_WEEK,
    DATE_FILTERS.LAST_MONTH,
    DATE_FILTERS.RANGE,
];

/**
 * @ngdoc directive
 * @module superdesk.analytics.search
 * @name sdaDateFilters
 * @requires moment
 * @requires $interpolate
 * @requires lodash
 * @requires gettextCatalog
 * @description A directive that provides date filters for reports
 */
export function DateFilters(moment, $interpolate, _, gettextCatalog) {
    return {
        template: require('../views/date-filters.html'),
        scope: {
            params: '=',
            _onFilterChange: '=?onFilterChange',
            onDatesChange: '=?',
            form: '=',
            config: '=',
        },
        link: function(scope) {
            /**
             * @ngdoc method
             * @name sdaDateFilters#init
             * @description Initializes date filters and variables
             */
            this.init = () => {
                scope.enabled = {};
                scope.filters = [];

                Object.values(DATE_FILTERS).forEach(
                    (filter) => {
                        const enabled = scope.config.isEnabled(REPORT_CONFIG.DATE_FILTERS, filter);

                        scope.enabled[filter] = enabled;
                        if (enabled) {
                            scope.filters.push(filter);
                        }
                    }
                );

                scope.groupEnabled = {
                    absolute: scope.enabled[DATE_FILTERS.RANGE] ||
                        scope.enabled[DATE_FILTERS.DAY],
                    hours: scope.enabled[DATE_FILTERS.RELATIVE_HOURS],
                    days: scope.enabled[DATE_FILTERS.RELATIVE_DAYS] ||
                        scope.enabled[DATE_FILTERS.YESTERDAY] ||
                        scope.enabled[DATE_FILTERS.TODAY],
                    weeks: scope.enabled[DATE_FILTERS.RELATIVE_WEEKS] ||
                        scope.enabled[DATE_FILTERS.LAST_WEEK] ||
                        scope.enabled[DATE_FILTERS.THIS_WEEK],
                    months: scope.enabled[DATE_FILTERS.RELATIVE_MONTHS] ||
                        scope.enabled[DATE_FILTERS.LAST_MONTH] ||
                        scope.enabled[DATE_FILTERS.THIS_MONTH],
                    year: scope.enabled[DATE_FILTERS.LAST_YEAR] ||
                        scope.enabled[DATE_FILTERS.THIS_YEAR],
                };

                scope.onFilterChange(false);
            };

            const getCurrentConfig = () => {
                const config = scope.config.getAttribute(
                    REPORT_CONFIG.DATE_FILTERS,
                    scope.params.dates.filter
                );

                if (config && config.max && typeof config.max === 'string') {
                    config.max = parseInt(config.max, 10);
                }

                return config;
            };

            /**
             * @ngdoc method
             * @name sdaDateFilters#onFilterChange
             * @description Updates date parameters when filter changes
             */
            scope.onFilterChange = (callOnChange = true) => {
                const currentConfig = getCurrentConfig();
                const filter = _.get(scope, 'params.dates.filter');

                scope.max = _.get(currentConfig, 'max');

                if (filter !== DATE_FILTERS.RANGE) {
                    delete scope.params.dates.start;
                    delete scope.params.dates.end;
                }
                if (filter !== DATE_FILTERS.DAY) {
                    delete scope.params.dates.date;
                }

                if (filter === DATE_FILTERS.RELATIVE_HOURS) {
                    scope.choices = Array.from(Array(scope.max).keys())
                        .map((hours) => $interpolate(
                            gettextCatalog.getString('{{hours}} hours')
                        )({hours: hours + 1}));
                } else if (filter === DATE_FILTERS.RELATIVE_DAYS) {
                    scope.choices = Array.from(Array(scope.max).keys())
                        .map((days) => $interpolate(
                            gettextCatalog.getString('{{days}} days')
                        )({days: days + 1}));
                } else if (filter === DATE_FILTERS.RELATIVE_WEEKS) {
                    scope.choices = Array.from(Array(scope.max).keys())
                        .map((weeks) => $interpolate(
                            gettextCatalog.getString('{{weeks}} weeks')
                        )({weeks: weeks + 1}));
                } else if (filter === DATE_FILTERS.RELATIVE_MONTHS) {
                    scope.choices = Array.from(Array(scope.max).keys())
                        .map((months) => $interpolate(
                            gettextCatalog.getString('{{months}} months')
                        )({months: months + 1}));
                } else {
                    scope.choices = null;
                    delete scope.params.dates.relative;
                }

                if (callOnChange && angular.isDefined(scope._onFilterChange)) {
                    scope._onFilterChange();
                }
            };

            /**
             * @ngdoc method
             * @name sdaDateFilters#validateParams
             * @param {Object} params - Scopes parameters
             * @description Validates the date parameters and populates the form.datesError
             */
            const validate = (params) => {
                scope.form.datesError = null;

                const currentConfig = getCurrentConfig();
                const dates = _.get(params, 'dates');
                const dateFilter = _.get(dates, 'filter');

                if (dateFilter === DATE_FILTERS.RANGE) {
                    if (!dates.start) {
                        scope.form.datesError = gettextCatalog.getString('Start date is required');
                    } else if (!dates.end) {
                        scope.form.datesError = gettextCatalog.getString('End date is required');
                    } else if (_.get(currentConfig, 'max')) {
                        let range = moment(dates.end, appConfig.model.dateformat)
                            .diff(moment(dates.start, appConfig.model.dateformat), 'days');

                        if (range > currentConfig.max) {
                            scope.form.datesError = $interpolate(
                                gettextCatalog.getString('Range cannot be greater than {{max}} days')
                            )({max: currentConfig.max});
                        } else if (moment(dates.start, appConfig.model.dateformat)
                            .isAfter(moment(), 'days')) {
                            scope.form.datesError = gettextCatalog.getString('Start date cannot be greater than today');
                        } else if (moment(dates.end, appConfig.model.dateformat)
                            .isAfter(moment(), 'days')) {
                            scope.form.datesError = gettextCatalog.getString('End date cannot be greater than today');
                        }
                    }
                } else if (scope.choices !== null && !scope.params.dates.relative) {
                    scope.form.datesError = gettextCatalog.getString('Relative value is required');
                } else if (dateFilter === DATE_FILTERS.DAY && !dates.date) {
                    scope.form.datesError = gettextCatalog.getString('Date field is required');
                }

                scope.form.showErrors = _.get(scope, 'form.submitted') && _.get(scope, 'form.datesError');
            };

            scope.$watch('config', angular.bind(this, this.init));

            if (angular.isDefined(scope.form)) {
                scope.$watch('params', validate, true);
            }
        },
    };
}
