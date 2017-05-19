var Highcharts = require('highcharts');

require('highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/data')(Highcharts);


ContentQuotaChart.$inject = ['lodash', 'moment', 'desks'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.track-activity-report
 * @name TrackActivityChart
 * @requires lodash
 * @requires moment
 * @requires desks
 * @description Track activity chart generation service
 */
export function ContentQuotaChart(_, moment, desks) {
    // var finisheItemColor = 'green',
    //     unfinishedItemColor = 'yellow',
    //     sentBackColor = 'brown',
    //     publishedColor = 'blue';

    /**
     * @ngdoc method
     * @name TrackActivityChart#formatTimestamp
     * @param {Integer} timestamp
     * @description Format given timestamp
     */
    // var formatTimestamp = function(timestamp) {
    //     return timestamp ? moment.unix(timestamp).format('YYYY-MM-DD HH:mm') : null; // jshint ignore:line
    // };

    /**
     * @ngdoc method
     * @name TrackActivityChart#createChart
     * @param {Object} report
     * @description Creates a chart for the given report
     */
    this.createChart = function(contentQuotaReport, renderTo, title) {
        var categories = [], data = [], series = [];

        for (var i = 0; i <= contentQuotaReport.report.length - 1; i++) {
            if (contentQuotaReport.report[i].items_total>=1){
            data.push(contentQuotaReport.report[i].items_total);            
            }
            else{
                data.push(0);

            }
            categories.push('interval' + (i+1));
        }
        series.push({data: data})

        var chartData = {
            chart: {
                type: 'column',
            },
            legend: {
                enabled: true
            },
            title: {
                text: title
            },
            xAxis: {
                categories: categories
            },
            series: series
        };

        Highcharts.chart(renderTo, chartData);
    };
}
