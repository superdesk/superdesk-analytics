SourceCategoryChart.$inject = ['lodash', 'Highcharts', 'gettext', 'moment'];

export function SourceCategoryChart(_, Highcharts, gettext, moment) {
    var formatDate = function(dateTime) {
        return moment(dateTime).format('LL');
    };

    this.createChart = function(report, renderTo) {
        var chartData = {
            chart: {type: 'bar'},
            title: {text: gettext('Stories per Category with Source breakdown')},
            subtitle: {text: formatDate(report.start_date) + ' - ' + formatDate(report.end_date)},
            xAxis: {
                title: {text: gettext('Category')},
                categories: _.get(report, 'report.categories'),
            },
            yAxis: {
                min: 0,
                title: {text: gettext('Stories')},
                stackLabels: {
                    enabled: true,
                    style: {
                        fontWeight: 'bold',
                        color: 'gray'
                    }
                }
            },
            legend: {
                enabled: true,
                reversed: true,
                align: 'right',
                x: -30,
                verticalAlign: 'top',
                y: 25,
                floating: true,
                backgroundColor: 'white',
                borderColor: '#CCC',
                borderWidth: 1,
                shadow: false
            },
            tooltip: {
                headerFormat: '<b>{series.name}/{point.x}:</b> {point.y}',
                pointFormat: '',
            },
            plotOptions: {
                bar: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: 'white',
                        formatter: function() {
                            // Don't show bars with a 0 value
                            if (this.y > 0) {
                                return this.y;
                            }
                        }
                    }
                }
            },
            series: _.sortBy(
                _.get(report, 'report.series'),
                (data) => _.sum(data.data)
            )
        };

        return Highcharts.chart(renderTo, chartData);
    };
}
