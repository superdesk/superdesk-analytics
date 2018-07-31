ActivityReportView.$inject = ['activityChart', '$timeout'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdActivityReportView
 * @description A directive that displays the generated activity report
 */
export function ActivityReportView(activityChart, $timeout) {
    return {
        template: require('../views/activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.$on('view:activity_report', (event, activityReport) => {
                scope.activityReport = activityReport;
                $timeout(() => {
                    scope.chart = activityChart.createChart(activityReport, 'activity-report', 'activity-report');
                }, 0);
            });
        }
    };
}
