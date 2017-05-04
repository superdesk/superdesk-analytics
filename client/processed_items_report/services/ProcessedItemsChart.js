ProcessedItemsChart.$inject = ['Highcharts', 'gettext'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.processed-items-report
 * @name ProcessedItemsChart
 * @description Processed items chart generation service
 */
export function ProcessedItemsChart(Highcharts, gettext) {
    /**
     * @ngdoc method
     * @name ProcessedItemsChart#createChart
     * @param {Object} processedItemsReport
     * @description Creates a chart for the given report
     */
    this.createChart = function(processedItemsReport, renderTo) {
        var startTime = moment(processedItemsReport.start_time),
            endTime = moment(processedItemsReport.end_time),
            series = [];

        for (var i = 0; i <= processedItemsReport.report.length - 1; i++) {
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
            title: {
                text: startTime.calendar() + ' - ' + endTime.calendar()
            },
            xAxis: {
                categories: [gettext('Published'), gettext('Corrected'), gettext('Spiked'),
                    gettext('Killed'), gettext('Total')]
            },
            yAxis: {
                title: {
                    text: gettext('Items No')
                }
            },
            yAxis: {
                title: {
                    text: 'Items No'
                }
            },
            series: series
        };

        return Highcharts.chart(renderTo, options);
    };
}