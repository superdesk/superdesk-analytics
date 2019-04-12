import {REPORT_CONFIG} from '../../services/ReportConfigService';

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

export function ChartOptions(chartConfig) {
    return {
        scope: {
            params: '=',
            fields: '=?',
            titlePlaceholder: '=?',
            subtitlePlaceholder: '=?',
            updateChartConfig: '=?',
            config: '=',
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

            scope.types = chartConfig.filterChartTypes(
                Object.keys(scope.config.get(REPORT_CONFIG.CHART_TYPES))
            );
        },
    };
}
