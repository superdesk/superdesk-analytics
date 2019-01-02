DateFilters.$inject = [];

export const DATE_FILTERS = {
    YESTERDAY: 'yesterday',
    LAST_WEEK: 'last_week',
    LAST_MONTH: 'last_month',
    RANGE: 'range',
    RELATIVE: 'relative',
    RELATIVE_DAYS: 'relative_days',
    DAY: 'day',
};

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
 * @description A directive that provides date filters for reports
 */
export function DateFilters() {
    return {
        template: require('../views/date-filters.html'),
        scope: {
            params: '=',
            filters: '=?',
            _onFilterChange: '=?onFilterChange',
            onDatesChange: '=?',
            maxRange: '=?',
            maxRelativeDays: '=?'
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

                if (angular.isUndefined(scope.maxRange) && scope.enabled.relative) {
                    scope.maxRange = 72;
                }

                if (angular.isUndefined(scope.maxRelativeDays) && scope.enabled.relative_days) {
                    scope.maxRelativeDays = 31;
                }
            };

            scope.$watch('filters', this.init);

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

            this.init();
        },
    };
}
