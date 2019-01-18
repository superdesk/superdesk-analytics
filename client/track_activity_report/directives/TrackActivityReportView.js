TrackActivityReportView.$inject = ['trackActivityReport', 'trackActivityChart', '$interval', '$timeout'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.track-activity-report
 * @name sdTrackActivityReportView
 * @requires trackActivityReport
 * @requires trackActivityChart
 * @requires $interval
 * @requires $timeout
 * @description A directive that displays the generated track activity report
 */
export function TrackActivityReportView(trackActivityReport, trackActivityChart, $interval, $timeout) {
    return {
        template: require('../views/track-activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            var regenerateInterval = 60000,
                interval = null;

            /**
             * @ngdoc method
             * @name sdTrackActivityReportView#regenerateReport
             * @description Regenerate the report and the chart
             */
            var regenerateReport = function() {
                if (scope.trackActivityReport) {
                    trackActivityReport.generate(scope.trackActivityReport)
                    .then((report) => {
                        scope.trackActivityReport = report;
                        scope.generateChart();
                    });
                }
            };

            /**
             * @ngdoc method
             * @name sdTrackActivityReportView#resetInterval
             * @description Reset the periodic generation of the chart
             */
            var resetInterval = function() {
                if (angular.isDefined(interval)) {
                    $interval.cancel(interval);
                }
                interval = $interval(regenerateReport, regenerateInterval);
            };

            /**
             * @ngdoc method
             * @name sdTrackActivityReportView#generateChart
             * @description Generate the track activity chart
             */
            scope.generateChart = () => {
                resetInterval();
                trackActivityChart.createChart(scope.trackActivityReport, 'track-activity');
            };

            scope.$on('view:track_activity_report', (event, args) => {
                scope.trackActivityReport = args;
                $timeout(scope.generateChart, 0);
            });

            scope.$on('$destroy', () => {
                if (angular.isDefined(interval)) {
                    $interval.cancel(interval);
                    interval = null;
                }
            });
        },
    };
}
