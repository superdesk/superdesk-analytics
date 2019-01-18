var moment = require('moment');

require('twix');


ActivityChart.$inject = ['lodash', 'chartManager'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.activity-report
 * @name ActivityChart
 * @requires lodash
 * @description Activity chart generation service
 */
export function ActivityChart(_, chartManager) {
    var dateFormat = 'YYYY-MM-DD',
        timeFormat = 'YYYY-MM-DD HH:mm';

    /**
     * @ngdoc method
     * @name ActivityChart#getSeriesName
     * @param {Object} report
     * @description Return the series name
     */
    var getSeriesName = function(report) {
        var startTime = moment(report.operation_start_date).local();
        var endTime = moment(report.operation_end_date).local();
        var timestampFormat = _.has(report.report, 'items_per_day') ? dateFormat : timeFormat;

        return gettext('Published items on') + ' ' + startTime.format(timestampFormat) + ' - ' +
            endTime.format(timestampFormat) + ' (' + report.report.total + ' total)';
    };

    /**
     * @ngdoc method
     * @name ActivityChart#getTimeData
     * @param {Object} report
     * @description Return the time data
     */
    var getTimeData = function(report) {
        var startTime = moment(report.operation_start_date).utc();
        var endTime = moment(report.operation_end_date).utc();
        var timestamps, valueField, timestampFormat;

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

        timestamps = _.map(timestamps, (value) => moment.utc(value).local()
                        .format(timestampFormat));

        return {
            categories: timestamps,
            data: data,
        };
    };

    /**
     * @ngdoc method
     * @name ActivityChart#getGroupData
     * @param {Object} report
     * @description Return the group data
     */
    var getGroupData = function(report) {
        var categories = _.map(report.report.desks, (value) => value.desk);
        var data = _.map(report.report.desks, (value) => value.items);

        return {
            categories,
            data,
        };
    };

    /**
     * @ngdoc method
     * @name ActivityChart#createChart
     * @param {Object} report
     * @param {String} renderTo
     * @param {String} reportId
     * @description Creates a chart for the given report
     */
    this.createChart = function(report, renderTo, reportId) {
        var operation = report.operation === 'publish' ? gettext('Published items') :
            gettext('Corrected items');
        var reportData = report.group_by && report.group_by.desk ? getGroupData(report) : getTimeData(report);

        return [{
            id: 'activity',
            type: 'column',
            chart: {
                type: 'column',
            },
            title: {
                text: null,
            },
            legend: {
                enabled: true,
            },
            xAxis: {
                categories: reportData.categories,
            },
            yAxis: {
                title: {
                    text: operation,
                },
            },
            tooltip: {
                pointFormatter: function() {
                    return '<span style="color:' + this.color + '"></span> ' +
                        '<b>' + operation + ' ' + this.y + '</b>';
                },
            },
            series: [{
                name: getSeriesName(report),
                data: reportData.data,
            }],
        }];
    };
}
