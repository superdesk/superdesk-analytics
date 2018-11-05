DateFilters.$inject = [];

export const DATE_FILTERS = {
    YESTERDAY: 'yesterday',
    LAST_WEEK: 'last_week',
    LAST_MONTH: 'last_month',
    RANGE: 'range',
    RELATIVE: 'relative',
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
            onFilterChange: '=?',
            onDatesChange: '=?',
            maxRange: '=?',
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
            };

            this.init();
        },
    };
}
