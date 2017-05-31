var moment = require('moment');

require('twix');


ActivityChart.$inject = ['lodash', 'Highcharts'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.activity-report
 * @name ActivityChart
 * @requires lodash
 * @description Activity chart generation service
 */
export function ActivityChart(_, Highcharts) {
    var dateFormat = 'YYYY-MM-DD',
        timeFormat = 'YYYY-MM-DD HH:mm';

    /**
     * @ngdoc method
     * @name ActivityChart#getSeriesName
     * @param {Object} report
     * @description Return the series name
     */
    var getSeriesName = function(report) {
        var startTime = moment(report.operation_start_date),
            endTime = moment(report.operation_end_date),
            timestampFormat = _.has(report.report, 'items_per_day') ? dateFormat : timeFormat;

        return gettext('Published items on') + ' ' + startTime.format(timestampFormat) + ' - ' +
            endTime.format(timestampFormat) + ' (' + report.report.total + ' total)';
    };

    /**
     * @ngdoc method
     * @name ActivityChart#getReportData
     * @param {Object} report
     * @description Return the report data
     */
    var getReportData = function(report) {
        var startTime = moment(report.operation_start_date),
            endTime = moment(report.operation_end_date),
            timestamps, valueField, timestampFormat;

        if (_.has(report.report, 'items_per_day')) {
            timestamps = moment.twix(startTime, endTime).toArray('days'),
            valueField = 'items_per_day';
            timestampFormat = dateFormat;
        } else {
            timestamps = moment.twix(startTime, endTime).toArray('hours'),
            valueField = 'items_per_hour';
            timestampFormat = timeFormat;
        }

        timestamps = _.map(timestamps, (value) => value.format(timestampFormat));

        var data = _.map(timestamps, (value) => {
            if (_.has(report.report[valueField], value)) {
                return report.report[valueField][value];
            }
            return 0;
        });

        return {
            categories: timestamps,
            data: data
        };
    };

    /**
     * @ngdoc method
     * @name ActivityChart#createChart
     * @param {Object} report
     * @param {Object} renderTo
     * @description Creates a chart for the given report
     */
    this.createChart = function(report, renderTo) {
        var operation = report.operation === 'publish' ? gettext('Published') : gettext('Corrected'),
            reportData = getReportData(report);

        var chartData = {
            chart: {
                type: 'column'
            },
            title: {
                text: null
            },
            legend: {
                enabled: true
            },
            xAxis: {
                categories: reportData.categories
            },
            yAxis: {
                title: {
                    text: operation + ' ' + gettext('Items')
                }
            },
            tooltip: {
                pointFormatter: function() {
                    return '<span style="color:' + this.color + '"></span> ' +
                        '<b>' + gettext('Published items:') + ' ' + this.y + '</b>';
                }
            },
            series: [{
                name: getSeriesName(report),
                data: reportData.data
            }]
        };

        return Highcharts.chart(renderTo, chartData);
    };

    /**
     * @ngdoc method
     * @name ActivityChart#updateChartData
     * @param {Object} report
     * @param {Object} chart
     * @description Updates a chart for the given report
     */
    this.updateChartData = function(report, chart) {
        chart.series[0].setData(getReportData(report).data);
        return chart;
    };
}
