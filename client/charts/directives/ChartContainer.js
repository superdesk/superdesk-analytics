ChartContainer.$inject = ['lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.charts
 * @name sdChartContainer
 * @requires lodash
 * @description A directive that renders an array of Highcharts instances given their configs
 */
export function ChartContainer(_) {
    return {
        scope: {configs: '<'},
        template: require('../views/chart-container.html'),
    };
}
