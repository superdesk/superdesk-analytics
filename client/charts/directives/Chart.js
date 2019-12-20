Chart.$inject = ['chartManager', '$timeout', '$sce', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.charts
 * @name sdChart
 * @requires chartManager
 * @requires $timeout
 * @description A directive that renders a Highcharts instance given its config
 */
export function Chart(chartManager, $timeout, $sce, _) {
    return {
        scope: {config: '<'},
        template: require('../views/chart.html'),
        link: function(scope, element, attrs) {
            let target = element.find('div');

            scope.$watch('config', (newConfig, oldConfig) => {
                if (newConfig) {
                    render(newConfig, newConfig.id);
                } else if (_.get(oldConfig, 'id')) {
                    chartManager.destroy(oldConfig.id);
                }
            });

            scope.$on('$destroy', () => {
                if (_.get(scope, 'config.id')) {
                    chartManager.destroy(scope.config.id);
                }
            });

            /**
             * @ngdoc method
             * @name sdChart#exportChart
             * @description Exports the Highcharts instance to a file
             */
            scope.exportChart = function() {
                chartManager.export(scope.config.id, {
                    type: 'application/pdf',
                    filename: 'chart-pdf',
                });
            };

            scope.$on('analytics:toggle-filters', () => {
                // Wait for the filter panel to finish its hide/show animation
                // before resizing this chart
                $timeout(() => {
                    scope.$applyAsync(() => {
                        chartManager.reflow(scope.config.id);
                    });
                }, 500);
            });

            /**
             * @ngdoc method
             * @name sdChart#render
             * @param {Object} config - The Highcharts config
             * @param {String} name - The ID associated with this Highcharts instance
             * @description Renders this Highcharts instance
             */
            function render(config, name) {
                $timeout(() => {
                    scope.$applyAsync(() => {
                        chartManager.create(target[0], config, name);
                    });
                }, 0);
            }

            /**
             * @ngdoc method
             * @name sdChart#downloadAsCSV
             * @description Using the chartManager, download the chart data as a CSV file
             */
            scope.downloadAsCSV = function() {
                chartManager.downloadCSV(scope.config);
            };

            /**
             * @ngdoc method
             * @name sdChart#getHtml
             * @param {string} html - String to convert to html nodes
             * @return {HTMLElement}
             * @description This allows table data cells to contain html nodes
             */
            scope.getHtml = function(html) {
                // Make sure to force html to be a string (statistics are numbers after all)
                return $sce.trustAsHtml('' + html);
            };
        },
    };
}
