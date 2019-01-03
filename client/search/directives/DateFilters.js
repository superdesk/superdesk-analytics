DateFilters.$inject = ['gettext', 'moment', '$interpolate', 'config'];

/**
 * @ngdoc property
 * @module superdesk.analytics.search
 * @name DATE_FILTERS
 * @type {Object}
 * @description Available date filters
 */
export const DATE_FILTERS = {
    YESTERDAY: 'yesterday',
    LAST_WEEK: 'last_week',
    LAST_MONTH: 'last_month',
    RANGE: 'range',
    RELATIVE: 'relative',
    RELATIVE_DAYS: 'relative_days',
    DAY: 'day',
};

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
 * @requires gettext
 * @requires moment
 * @requires $interpolate
 * @requires config
 * @description A directive that provides date filters for reports
 */
export function DateFilters(gettext, moment, $interpolate, config) {
    return {
        template: require('../views/date-filters.html'),
        scope: {
            params: '=',
            filters: '=?',
            _onFilterChange: '=?onFilterChange',
            onDatesChange: '=?',
            maxRange: '=?',
            maxRelativeDays: '=?',
            form: '=',
        },
        link: function(scope) {
            /**
             * @ngdoc method
             * @name sdaDateFilters#init
             * @description Initializes date filters and variables
             */
            this.init = () => {
                if (angular.isUndefined(scope.filters)) {
                    scope.filters = DEFAULT_FILTERS;
                }

                scope.enabled = {};

                Object.values(DATE_FILTERS).forEach(
                    (filter) => {
                        scope.enabled[filter] = scope.filters.indexOf(filter) > -1;
                    }
                );

                if (angular.isUndefined(scope.maxRange)) {
                    scope.maxRange = 72;
                }

                if (angular.isUndefined(scope.maxRelativeDays) && scope.enabled.relative_days) {
                    scope.maxRelativeDays = 31;
                }
            };

            scope.$watch('filters', this.init);

            /**
             * @ngdoc method
             * @name sdaDateFilters#onFilterChange
             * @description Updates date parameters when filter changes
             */
            scope.onFilterChange = () => {
                if (scope.params.dates.filter !== 'range') {
                    delete scope.params.dates.start;
                    delete scope.params.dates.end;
                }
                if (scope.params.dates.filter !== 'relative') {
                    delete scope.params.dates.relative;
                }
                if (scope.params.dates.filter !== 'relative_days') {
                    delete scope.params.dates.relative_days;
                }
                if (scope.params.dates.filter !== 'day') {
                    delete scope.params.dates.date;
                }

                scope._onFilterChange();
            };

            /**
             * @ngdoc method
             * @name sdaDateFilters#validateParams
             * @param {Object} params - Scopes parameters
             * @description Validates the date parameters and populates the form.datesError
             */
            const validate = (params) => {
                scope.form.datesError = null;

                const dates = _.get(params, 'dates');
                const dateFilter = _.get(dates, 'filter');

                if (dateFilter === 'range') {
                    if (!dates.start) {
                        scope.form.datesError = gettext('Start date is required');
                    } else if (!dates.end) {
                        scope.form.datesError = gettext('End date is required');
                    } else {
                        let range = moment(dates.end, config.model.dateformat)
                            .diff(moment(dates.start, config.model.dateformat), 'days');

                        if (range > scope.maxRange) {
                            scope.form.datesError = $interpolate(
                                gettext('Range cannot be greater than {{max}} days')
                            )({max: scope.maxRange});
                        } else if (moment(dates.start, config.model.dateformat).isAfter(moment(), 'days')) {
                            scope.form.datesError = gettext('Start date cannot be greater than today');
                        } else if (moment(dates.end, config.model.dateformat).isAfter(moment(), 'days')) {
                            scope.form.datesError = gettext('End date cannot be greater than today');
                        }
                    }
                } else if (dateFilter === 'relative_days' && !dates.relative_days) {
                    scope.form.datesError = gettext('Number of days is required');
                } else if (dateFilter === 'day' && !dates.date) {
                    scope.form.datesError = gettext('Date field is required');
                } else if (dateFilter === 'relative' && !dates.relative) {
                    scope.form.datesError = gettext('Number of hours is required');
                }
            };

            if (angular.isDefined(scope.form)) {
                scope.$watch('params', validate, true);
            }

            this.init();
        },
    };
}
