/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.charts
 * @name sdChartContainer
 * @description A directive that renders an array of Highcharts instances given their configs
 */
export function ChartContainer() {
    return {
        replace: true,
        require: '^sdAnalyticsContainer',
        template: require('../views/chart-container.html'),
    };
}
