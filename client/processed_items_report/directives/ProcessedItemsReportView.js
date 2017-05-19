ProcessedItemsReportView.$inject = ['api', 'session', 'processedItemsChart', '$interval'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-report
 * @name sdProcessedItemsReportView
 * @description A directive that displays the generated processed items report
 */

export function ProcessedItemsReportView(api, session, processedItemsChart, $interval) {
    return {
        template: require('../views/processed-items-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            var regenerateInterval = 60000,
                interval = null,
                regenerateReport,
                resetInterval;

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportView#regenerateReport
             * @description Regenerate the report and the chart
             */
            regenerateReport = function() {
                if (scope.processedItemsReport) {
                    var processedItemsReport = _.clone(scope.processedItemsReport);

                    processedItemsReport = {
                        start_time: processedItemsReport.start_time,
                        end_time: processedItemsReport.end_time,
                        users: processedItemsReport.users
                    };
                    scope.generate(processedItemsReport)
                        .then(() => {
                            scope.generateChart();
                        });
                }
            };
            /**
             * @ngdoc method
             * @name sdProcessedItemsReportView#resetInterval
             * @description Reset the periodic generation of the chart
             */
            resetInterval = function() {
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

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportView#generate
             * @param {Object} query
             * @description Generate the report
             */
            scope.generate = function(query) {
                return api('processed_items_report', session.identity).save({}, query)
                    .then((processedItemsReport) => processedItemsReport);
            };

            resetInterval();

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