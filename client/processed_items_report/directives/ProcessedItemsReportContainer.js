/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-report
 * @name sdProcessedItemsReportContainer
 * @description Container directive
 */
export function ProcessedItemsReportContainer() {
    return {
        controller: ['gettext', 'pageTitle',
            function ProcessedItemsReportContainerController(gettext, pageTitle) {
                pageTitle.setUrl(gettext('Processed Items Report'));
            }
        ]
    };
}
