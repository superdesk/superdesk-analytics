ProcessedItemsReportView.$inject = ['processedItemsReport', 'processedItemsChart', '$interval'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-report
 * @name sdProcessedItemsReportView
 * @description A directive that displays the generated processed items report
 */

export function ProcessedItemsReportView(processedItemsReport, processedItemsChart, $interval) {
    return {
        template: require('../views/processed-items-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            var regenerateInterval;

            var interval = null;

            var regenerateReport;

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportView#regenerateReport
             * @description Regenerate the report and the chart
             */
            regenerateReport = function() {
                if (scope.processedItemsReport) {
                    delete scope.processedItemsReport;
                    processedItemsReport.generate(scope.processedItemsReport)
                        .then((processedItemsReport) => {
                            scope.processedItemsReport = processedItemsReport;
                            scope.generateChart();
                        });
                }
            };
            /**
             * @ngdoc method
             * @name sdProcessedItemsReportView#resetInterval
             * @description Reset the periodic generation of the chart
             */
            scope.resetInterval = function() {
                regenerateInterval = 60000;
                if (angular.isDefined(interval)) {
                    $interval.cancel(interval);
                }
                interval = $interval(regenerateReport, regenerateInterval);
            };
            /**
             * @ngdoc method
             * @name sdProcessedITemsReportView#generateChart
             * @description Generate the processed items chart
             */
            scope.generateChart = () => {
                processedItemsChart.createChart(scope.processedItemsReport, 'containerp');
            };

            scope.$on('view:processed_items_report', (event, args) => {
                scope.processedItemsReport = args;
                scope.generateChart();
            });

            scope.$on('$destroy', () => {
                if (angular.isDefined(interval)) {
                    $interval.cancel(interval);
                }
            });
        }
    };
}