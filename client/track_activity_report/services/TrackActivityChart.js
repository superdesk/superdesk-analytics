TrackActivityChart.$inject = ['lodash', 'moment', 'desks', 'Highcharts'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.track-activity-report
 * @name TrackActivityChart
 * @requires lodash
 * @requires moment
 * @requires desks
 * @description Track activity chart generation service
 */
export function TrackActivityChart(_, moment, desks, Highcharts) {
    var finisheItemColor = 'green',
        unfinishedItemColor = 'yellow',
        sentBackColor = 'brown',
        publishedColor = 'blue';

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
    this.createChart = function(report, renderTo) {
        var categories = [], data = [],
            currentTime = moment().unix(),
            desk = desks.deskLookup[report.desk],
            stage = desks.stageLookup[report.stage],
            sortedReport = _.sortBy(report.report, [(item) => item.item.headline]),
            seriesName = 'Items for stage ' + stage.name + ' (' + desk.name + ')';

        if (report.user) {
            seriesName += '<br/>' + desks.userLookup[report.user].display_name;
        }

        _.forEach(sortedReport, (item) => {
            categories.push(item.item.headline);
            var itemData = {low: moment(item.entered_stage_at).unix()};

            if (item.published_on) {
                itemData.high = moment(item.published_on).unix();
                itemData.color = publishedColor;
            } else if (item.left_stage_at) {
                itemData.high = moment(item.left_stage_at).unix();
                itemData.color = item.sent_back ? sentBackColor : finisheItemColor;
            } else {
                itemData.high = currentTime;
                itemData.color = unfinishedItemColor;
            }
            data.push(itemData);
        });

        var chartData = {
            chart: {
                type: 'columnrange',
                inverted: true
            },
            legend: {
                enabled: true
            },
            title: {
                text: null
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

                    if (this.color === finisheItemColor || this.color === sentBackColor) {
                        format += ' - <b>left: ' + high + '</b>';
                    }
                    if (this.color === publishedColor) {
                        format += ' - <b>published: ' + high + '</b>';
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

        return Highcharts.chart(renderTo, chartData);
    };
}
