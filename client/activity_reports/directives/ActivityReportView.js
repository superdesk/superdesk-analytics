ActivityReportView.$inject = ['$location', 'asset'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdActivityReportView
 * @requires $location
 * @requires asset
 * @description A directive that displays the generated activity report
 */

var Highcharts = require('highcharts');
    require('highcharts/modules/exporting')(Highcharts);
    require('highcharts/modules/data')(Highcharts);

export function ActivityReportView($location, asset) {
    return {
        template: require('../views/activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.showActivityReport = false;
            scope.activityReport = null;
            scope.reportType = null;

            scope.$on('view:activity_report', (event, args) => {
                scope.activityReport = args;
                scope.generateChart();
                scope.getData();
                initActivityReport();
                console.log('activity report', scope.activityReport)
            });

            /**
             * @ngdoc method
             * @name sdActivityReportView#initActivityReport
             * @description Initialises the activity report object
             */

             scope.generateChart = function() {
                Highcharts.chart('container', {
                    chart: {
                        type: 'line',
                        renderTo: 'container'
                    },
                    xAxis: {
                        // categories: ['Jan', 'Feb', 'Mar', 'Apr']
                        categories: scope.getDaysNumber()
                    },
                    series: [{
                        name: 'User one',
                        data: [2, 4, 5, 7, 9, 5, 6, 4, 6, 7, 9]
                        }]
                });

            };
            scope.getDaysNumber = function(){
                var oneDay = 24*60*60*1000;
                var start = new Date(scope.activityReport.operation_date_start);
                var end = new Date(scope.activityReport.operation_date_end);
                console.log('start', start);
                console.log('end', end);
                var diffDays = Math.round(Math.abs((start.getTime() - end.getTime())/(oneDay)));
                var daysNumber = _.range(1, diffDays+1);
                return daysNumber
            };

            scope.getData = function() {
                console.log('here', scope.activityReport.report.length)

            };

            function initActivityReport() {
                if (scope.activityReport.group_by instanceof Array && scope.activityReport.group_by[0] === 'desk') {
                    scope.reportType = 'groupByDesk';
                } else {
                    scope.reportType = 'simple';
                }
            }
        }
    };
}
