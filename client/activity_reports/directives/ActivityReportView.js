ActivityReportView.$inject = ['$location', 'asset', 'activityChart', '$timeout'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdActivityReportView
 * @requires $location
 * @requires asset
 * @description A directive that displays the generated activity report
 */
export function ActivityReportView($location, asset, activityChart, $timeout) {
    return {
        template: require('../views/activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.$on('view:activity_report', (event, activityReport) => {
                scope.activityReport = activityReport;
                if (scope.chart) {
                    scope.chart.destroy();
                }
                $timeout(() => {
                    scope.chart = activityChart.createChart(activityReport, 'activity-report');
                }, 0);
            });
        }
    };
}
