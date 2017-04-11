var Highcharts = require('highcharts');

require('highcharts-more')(Highcharts);
require('highcharts/modules/exporting')(Highcharts);
require('highcharts/modules/data')(Highcharts);


TrackActivityChart.$inject = ['lodash', 'moment', 'desks'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.track-activity-report
 * @name TrackActivityChart
 * @requires lodash
 * @requires moment
 * @requires desks
 * @description Track activity chart generation service
 */
export function TrackActivityChart(_, moment, desks) {
    var finisheItemColor = 'green',
        unfinishedItemColor = 'yellow',
        sentBackColor = 'brown';

    /**
     * @ngdoc method
     * @name TrackActivityChart#formatTimestamp
     * @param {Integer} timestamp
     * @description Format given timestamp
     */
    var formatTimestamp = function(timestamp) {
        return timestamp ? moment.unix(timestamp).format('YYYY-MM-DD HH:mm') : null; // jshint ignore:line
    };

    /**
     * @ngdoc method
     * @name TrackActivityChart#createChart
     * @param {Object} report
     * @description Creates a chart for the given report
     */
    this.createChart = function(report, renderTo, title) {
        var categories = [], data = [],
            currentTime = moment().unix(),
            desk = desks.deskLookup[report.desk],
            stage = desks.stageLookup[report.stage];

        _.forEach(report.report, (item) => {
            categories.push(item.item.headline);
            var itemData = {low: moment(item.entered_stage_at).unix()};

            if (item.left_stage_at) {
                itemData.high = moment(item.left_stage_at).unix();
                itemData.color = item.sent_back ? sentBackColor : finisheItemColor;
            } else {
                itemData.high = currentTime;
                itemData.color = unfinishedItemColor;
            }
            data.push(itemData);
        });

        var seriesName = 'Items for stage ' + stage.name + ' (' + desk.name + ')';

        if (report.user) {
            seriesName += '<br/>' + desks.userLookup[report.user].display_name;
        }

        var chartData = {
            chart: {
                type: 'columnrange',
                inverted: true
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
            yAxis: {
                type: 'datetime',
                title: {
                    text: 'Time'
                },
                labels: {
                    formatter: function() {
                        return formatTimestamp(this.value);
                    }
                }
            },
            tooltip: {
                pointFormatter: function() {
                    var span = '<span style="color:' + this.color + '"></span> ',
                        low = formatTimestamp(this.low),
                        high = formatTimestamp(this.high),
                        format = span + '<b>entered: ' + low + '</b>';

                    if (this.color === finisheItemColor) {
                        format += ' - <b>left: ' + high + '</b>';
                    }
                    format += '<br/>';
                    return format;
                }
            },
            series: [{
                name: seriesName,
                lineWidth: 1,
                data: data
            }]
        };

        Highcharts.chart(renderTo, chartData);
    };
}
