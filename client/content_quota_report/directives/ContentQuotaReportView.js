ContentQuotaReportView.$inject = ['contentQuotaReport', 'contentQuotaChart', '$interval', '$timeout'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-quota-report
 * @name sdContentQuotaReportView
 * @requires contentQuotaReport
 * @requires contentQuotaChart
 * @requires $interval
 * @requires $timeout
 * @description A directive that displays the generated content quota report
 */
export function ContentQuotaReportView(contentQuotaReport, contentQuotaChart, $interval, $timeout) {
    return {
        template: require('../views/content-quota-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            var regenerateInterval = 60000,
                interval = null,
                chart = null;

            /**
             * @ngdoc method
             * @name sdContentQuotaReportView#regenerateReport
             * @description Regenerate the report and the chart
             */
            var regenerateReport = function() {
                if (scope.contentQuotaReport) {
                    contentQuotaReport.generate(scope.contentQuotaReport)
                    .then((report) => {
                        scope.contentQuotaReport = report;
                        resetChart(contentQuotaChart.createChart(scope.contentQuotaReport, 'containerq', null));
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
             * @name sdContentQuotaReportView#resetChart
             * @description Reset the chart variable
             */
            var resetChart = function(newChart) {
                if (chart) {
                    chart.destroy();
                }
                chart = newChart;
            };

            /**
             * @ngdoc method
             * @name sdContentQuotaReportView#generateChart
             * @description Generate the content quota chart
             */
            scope.generateChart = () => {
                resetInterval();
                resetChart(contentQuotaChart.createChart(scope.contentQuotaReport, 'content-quota', null));
            };

            scope.$on('view:content_quota_report', (event, args) => {
                scope.contentQuotaReport = args;
                $timeout(scope.generateChart, 0);
            });

            scope.$on('$destroy', () => {
                if (angular.isDefined(interval)) {
                    $interval.cancel(interval);
                }
                resetChart(null);
            });
        },
    };
}
