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
    var aboveQuota = 'green',
        underQuota = 'brown';

    /**
     * @ngdoc method
     * @name ContentQuotaChart#createChart
     * @param {Object} report
     * @description Creates a chart for the given report
     */
    this.createChart = function(contentQuotaReport, renderTo, title) {
        var categories = [], data = [];

        for (var i = 0; i <= contentQuotaReport.report.length - 1; i++) {

            if(contentQuotaReport.report[i].items_total >=1){
                if(contentQuotaReport.target){

                    if(contentQuotaReport.report[i].items_total >= contentQuotaReport.target){

                        data.push({
                            y: contentQuotaReport.report[i].items_total,
                            color: aboveQuota,
                            start: contentQuotaReport.report[i].start_time.split("T", 1),
                            end: contentQuotaReport.report[i].end_time.split("T", 1)
                        });
                    }
                    else{
                        data.push({
                            y: contentQuotaReport.report[i].items_total,
                            color: underQuota,
                            start: contentQuotaReport.report[i].start_time.split("T", 1),
                            end: contentQuotaReport.report[i].end_time.split("T", 1)
                        });
                    }
                }
                else{
                    data.push({
                            y: contentQuotaReport.report[i].items_total,
                            color: aboveQuota,
                            start: contentQuotaReport.report[i].start_time.split("T", 1),
                            end: contentQuotaReport.report[i].end_time.split("T", 1)
                        });
                }
            }
            else{
                data.push({
                        y: 0,
                        start: contentQuotaReport.report[i].start_time.split("T", 1),
                        end: contentQuotaReport.report[i].end_time.split("T", 1)
                    });
                }
            categories.push('Interval ' + (i+1));
               
        }

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
                    color: 'orange',
                    dashStyle: 'solid', 
                    value: contentQuotaReport.target, 
                    width: 3 ,
                    label: { 
                        text: 'Target Quota', 
                        align: 'left', 
                        x: +10 
                      } 

              }]
            },
            tooltip: {
                pointFormatter: function() {
                    var span = '<span style="color:' + this.color + '"></span> ',
                        format = span + '<b>Start:' + this.start+ '  End:'+ this.end+' </b><br/><b>Number of items:' + this.y + '</b>';
                    format += '<br/>';
                    return format;
                }
            },
            series: [{
                name: "Number of items",
                data: data
            }]
        };
        console.log("cccc", chartData.series);
        Highcharts.chart(renderTo, chartData);
    };
}
