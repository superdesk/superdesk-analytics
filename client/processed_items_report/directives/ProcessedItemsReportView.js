ProcessedItemsReportView.$inject = [];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-report
 * @name sdProcessedItemsReportView
 * @description A directive that displays the generated processed items report
 */
export function ProcessedItemsReportView() {
    return {
        template: require('../views/processed-items-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.$on('view:processed_items_report', (event, args) => {
                scope.processedItemsReport = args;
            });
        }
    };
}
