ContentQuotaChart.$inject = ['lodash', 'chartManager'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.content-quota-report
 * @name ContentQuotaChart
 * @requires lodash
 * @description Content quota chart generation service
 */

export function ContentQuotaChart(_, chartManager) {
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
            categories.push(formatDate(item.start_time) + ' : ' + formatDate(item.end_time));
        });

        return [{
            id: 'content_quota',
            type: 'column',
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
                    text: gettext('Time intervals')
                }
            },
            yAxis: {
                title: {
                    text: gettext('Number of items')
                },
                plotBands: [{
                    color: '#8cd9b3',
                    dashStyle: 'solid',
                    value: contentQuotaReport.target,
                    width: 3,
                    label: {
                        text: gettext('Target Quota'),
                        align: 'left',
                        x: +10
                    }
                }]
            },
            tooltip: {
                pointFormatter: function() {
                    var span, format;

                    span = '<span style="color:' + this.color + '"></span> ',
                        format = span + '<b>' + gettext('Number of items:') + this.y + '</b>';
                    format += '<br/>';
                    return format;
                }
            },
            series: [{
                name: gettext('Number of items per interval'),
                data: data
            }]
        }];
    };
}
