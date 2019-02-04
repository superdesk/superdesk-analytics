/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.charts
 * @name sdChartContainer
 * @description A directive that renders an array of Highcharts instances given their configs
 */
export function ChartContainer() {
    return {
        replace: true,
        require: '^sdaAnalyticsContainer',
        template: require('../views/chart-container.html'),
        link: function(scope, element) {
            // Scroll to the top when the report configs change
            scope.$watch('reportConfigs.charts', () => {
                element.parent().scrollTop(0);
            });
        },
    };
}
