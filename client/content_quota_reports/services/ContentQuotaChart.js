var Highcharts = require('highcharts');

require('highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/data')(Highcharts);


ContentQuotaChart.$inject = ['lodash', 'moment', 'desks', 'config'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.content-quota-reports
 * @name ContentQuotaChart
 * @requires lodash
 * @requires moment
 * @requires desks
 * @description Content quota chart generation service
 */

export function ContentQuotaChart(_, moment, desks, config) {
    var aboveQuota = '#008000',
        underQuota = 'brown',
        formatDate;

    formatDate = function(date) {
        return date.split('T', 1);
    };
    /**
     * @ngdoc method
     * @name ContentQuotaChart#createChart
     * @param {Object} report
     * @description Creates a chart for the given report
     */
    this.createChart = function(contentQuotaReport, renderTo, title) {
        var categories = [], data = [];

        _.forEach(contentQuotaReport.report, (item) => {
            if (item.items_total >= 1) {
                if (contentQuotaReport.target) {
                    if (item.items_total >= contentQuotaReport.target) {
                        data.push({
                            y: item.items_total,
                            color: aboveQuota,
                            start: formatDate(item.start_time),
                            end: formatDate(item.end_time)});
                    } else {
                        data.push({
                            y: item.items_total,
                            color: underQuota,
                            start: formatDate(item.start_time),
                            end: formatDate(item.end_time)});
                    }
                } else {
                    data.push({
                        y: item.items_total,
                        color: aboveQuota,
                        start: formatDate(item.start_time),
                        end: formatDate(item.end_time)});
                }
            } else {
                data.push({
                    y: 0,
                    start: formatDate(item.start_time),
                    end: formatDate(item.end_time)});
            }
            categories.push(formatDate(item.end_time) + ' : ' + formatDate(item.start_time));
        });

        var chartData = {
            chart: {
                type: 'column'
            },
            legend: {
                enabled: true
            },
            title: {
                text: title
            },
            xAxis: {
                categories: categories,
                type: 'datetime',
                title: {
                    text: 'Time intervals'
                }
            },
            yAxis: {
                title: {
                    text: 'Number of items'
                },
                plotBands: [{
                    color: '#8cd9b3',
                    dashStyle: 'solid',
                    value: contentQuotaReport.target,
                    width: 3,
                    label: {
                        text: 'Target Quota',
                        align: 'left',
                        x: +10
                    }
                }]
            },
            tooltip: {
                pointFormatter: function() {
                    var span, format;

                    span = '<span style="color:' + this.color + '"></span> ',
                        format = span + '<b>Number of items:' + this.y + '</b>';
                    format += '<br/>';
                    return format;
                }
            },
            series: [{
                name: 'Number of items per intervals',
                data: data
            }]
        };

        Highcharts.chart(renderTo, chartData);
    };
}
