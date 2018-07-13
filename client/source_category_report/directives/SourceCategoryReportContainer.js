
/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.source-category-report
 * @name sdSourceCategoryReportContainer
 * @description Container directive
 */
export function SourceCategoryReportContainer() {
    return {
        controller: ['gettext', 'pageTitle',
            function SourceCategoryReportContainerController(gettext, pageTitle) {
                pageTitle.setUrl(gettext('Source Category Report'));
            }
        ]
    };
}
