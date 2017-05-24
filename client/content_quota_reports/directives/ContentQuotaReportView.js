ContentQuotaReportView.$inject = ['contentQuotaReport', '$interval'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-quota-reports
 * @name sdContentQuotaReportView
 * @requires contentQuotaReport
 * @requires contentQuotaChart
 * @requires $interval
 * @description A directive that displays the generated content quota report
 */
export function ContentQuotaReportView(contentQuotaReport, $interval) {
    return {
        template: require('../views/content-quota-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            var regenerateInterval = 60000,
                interval = null;

            /**
             * @ngdoc method
             * @name sdContentQuotaReportView#regenerateReport
             * @description Regenerate the report and the chart
             */
            var regenerateReport = function() {
                if (scope.contentQuotaReport) {
                    var report;

                    report = {
                        start_time: scope.contentQuotaReport.start_time,
                        subject: scope.contentQuotaReport.subject,
                        keywords: scope.contentQuotaReport.keywords,
                        category: scope.contentQuotaReport.category,
                        intervals_number: scope.contentQuotaReport.intervals_number,
                        interval_length: scope.contentQuotaReport.interval_length,
                        target: scope.contentQuotaReport.target
                    };
                    contentQuotaReport.generate(report)
                        .then((report) => {
                            scope.contentQuotaReport = report;
                            scope.generateChart();
                        });
                }
            };

            /**
             * @ngdoc method
             * @name sdContentQuotaReportView#resetInterval
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
             * @name sdContentQuotaReportView#generateChart
             * @description Generate the content quota chart
             */
            // scope.generateChart = () => {
                resetInterval();
            //     trackActivityChart.createChart(scope.trackActivityReport, 'container', null);
            // };

            scope.$on('view:content_quota_reports', (event, args) => {
                scope.contentQuotaReport = args;
                // scope.generateChart();
            });

            scope.$on('$destroy', () => {
                if (angular.isDefined(interval)) {
                    $interval.cancel(interval);
                }
            });
        }
    };
}
