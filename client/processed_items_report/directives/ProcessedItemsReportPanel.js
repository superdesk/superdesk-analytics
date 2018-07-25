ProcessedItemsReportPanel.$inject = ['api', 'notify', '$rootScope', 'processedItemsReport', 'processedItemsChart'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-report
 * @name sdProcessedItemsReportPanel
 * @requires notify
 * @requires $rootScope
 * @description A directive that generates the sidebar containing processed items report parameters
 */
export function ProcessedItemsReportPanel(api, notify, $rootScope, processedItemsReport, processedItemsChart) {
    return {
        require: '^sdAnalyticsContainer',
        template: require('../views/processed-items-report-panel.html'),
        link: function(scope, element, attrs) {
            scope.validForm = false;
            scope.report = {time_interval: {measure: 'days', count: 1}, users: []};

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportPanel#generate
             * @returns {Promise}
             * @description Generate the report
             */
            scope.generate = function() {
                function onSuccess(processedItemsReport) {
                    scope.changeReportParams({
                        charts: processedItemsChart.createChart(processedItemsReport),
                    });
                    notify.success(gettext('The processed items report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The processed items report could not be generated.'));
                    }
                }

                return processedItemsReport.generate(scope.report).then(onSuccess, onFail);
            };
        }
    };
}