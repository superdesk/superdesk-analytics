var Highcharts = require('highcharts');

require('highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/data')(Highcharts);


ProcessedItemsChart.$inject = ['lodash'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.processed-items-report
 * @name ProcessedItemsChart
 * @requires lodash
 * @description Processed items chart generation service
 */
export function ProcessedItemsChart() {
    /**
     * @ngdoc method
     * @name ProcessedItemsChart#createChart
     * @param {Object} report
     * @description Creates a chart for the given report
     */
    this.createChart = function(processedItemsReport, renderTo) {
        var series = [];
        for (var i = 0; i <= processedItemsReport.report.length-1; i++){
                series.push({
                    name: processedItemsReport.report[i].user.display_name,
                    data: [
                    processedItemsReport.report[i].processed_items.published_items,
                    processedItemsReport.report[i].processed_items.corrected_items,
                    processedItemsReport.report[i].processed_items.spiked_items,
                    processedItemsReport.report[i].processed_items.killed_items,
                    processedItemsReport.report[i].processed_items.total_items
                    ]
                });
            }

        var options = {
                    chart: {
                        type: 'column'

                    },  
                    title:{
                        text: 'Processed Items Report'
                    },
                     xAxis: {
                        categories: ['Published', 'Corrected', 'Spiked', 'Killed', 'Total' ]
                    },
                     series: series
                };
            options.chart.renderTo = 'container';
            Highcharts.chart(options);
    };
}