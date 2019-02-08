ChartOptions.$inject = ['chartConfig'];

export const CHART_FIELDS = {
    TITLE: 'title',
    SUBTITLE: 'subtitle',
    TYPE: 'type',
    SORT: 'sort',
    PAGE_SIZE: 'page_size',
};

export const DEFAULT_CHART_FIELDS = [
    CHART_FIELDS.TITLE,
    CHART_FIELDS.SUBTITLE,
    CHART_FIELDS.TYPE,
    CHART_FIELDS.SORT,
];

export const CHART_TYPES = {
    BAR: 'bar',
    COLUMN: 'column',
    TABLE: 'table',
    AREA: 'area',
    LINE: 'line',
    PIE: 'pie',
    SCATTER: 'scatter',
    SPLINE: 'spline',
};

export const DEFAULT_CHART_TYPES = [
    CHART_TYPES.BAR,
    CHART_TYPES.COLUMN,
    CHART_TYPES.TABLE,
];

export function ChartOptions(chartConfig) {
    return {
        scope: {
            params: '=',
            fields: '=?',
            chartTypes: '=?',
            titlePlaceholder: '=?',
            subtitlePlaceholder: '=?',
            updateChartConfig: '=?',
        },
        template: require('../views/chart-form-options.html'),
        link: function(scope) {
            if (angular.isUndefined(scope.fields)) {
                scope.fields = DEFAULT_CHART_FIELDS;
            }

            scope.enabled = {};

            Object.values(CHART_FIELDS).forEach(
                (field) => {
                    scope.enabled[field] = scope.fields.indexOf(field) > -1;
                }
            );

            if (angular.isUndefined(scope.chartTypes)) {
                scope.chartTypes = DEFAULT_CHART_TYPES;
            }

            scope.types = chartConfig.filterChartTypes(scope.chartTypes);
        },
    };
}
