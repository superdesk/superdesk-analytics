TrackActivityReportView.$inject = ['trackActivityReport', 'trackActivityChart', '$interval'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.track-activity-report
 * @name sdTrackActivityReportView
 * @requires trackActivityReport
 * @requires trackActivityChart
 * @requires $interval
 * @description A directive that displays the generated track activity report
 */
export function TrackActivityReportView(trackActivityReport, trackActivityChart, $interval) {
    return {
        template: require('../views/track-activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.$on('view:track_activity_report', (event, args) => {
                scope.trackActivityReport = args;
                scope.generateChart();
            });

            /**
             * @ngdoc method
             * @name sdTrackActivityReportView#generateChart
             * @description Generate the track activity chart
             */
            scope.generateChart = () => {
                trackActivityChart.createChart(scope.trackActivityReport, 'container', null);
            };

            $interval(() => {
                if (scope.trackActivityReport) {
                    delete scope.trackActivityReport.report;
                    delete scope.trackActivityReport._id;
                    trackActivityReport.generate(scope.trackActivityReport)
                        .then((report) => {
                            scope.trackActivityReport = report;
                            scope.generateChart();
                        });
                }
            }, 60000);
        }
    };
}
