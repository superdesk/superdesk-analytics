ProcessedItemsReportView.$inject = ['processedItemsReport', 'processedItemsChart', '$interval'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-report
 * @name sdProcessedItemsReportView
 * @description A directive that displays the generated processed items report
 */
/*
var Highcharts = require('highcharts');
require('highcharts/modules/data')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
*/
export function ProcessedItemsReportView(processedItemsReport, processedItemsChart, $interval) {

    return {
        template: require('../views/processed-items-report-view.html'), 
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.$on('view:processed_items_report', (event, args) => {
                    scope.processedItemsReport = args;
                    scope.generateChart();
                });
            
            /**
             * @ngdoc method
             * @name sdProcessedITemsReportView#generateChart
             * @description Generate the processed items chart
             */
            scope.generateChart = () => {
                processedItemsChart.createChart(scope.processedItemsReport, 'container');
            };

            $interval(() => {
                if (scope.processedItemsReport) {
                    delete scope.processedItemsReport.report;
                    delete scope.processedItemsReport._id;
                    processedItemsReport.generate(scope.processedItemsReport)
                        .then((report) => {
                            scope.processedItemsReport = report;
                            scope.generateChart();
                        });
                }
            }, 60000); 
         }
    };

}