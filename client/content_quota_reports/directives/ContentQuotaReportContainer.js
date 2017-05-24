/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-quota-reports
 * @name sdContentQuotaReportContainer
 * @description Container directive
 */
export function ContentQuotaReportContainer() {
    return {
        controller: ['gettext', 'pageTitle',
            function ContentQuotaReportContainerController(gettext, pageTitle) {
                pageTitle.setUrl(gettext('Content Quota Report'));
            }
        ]
    };
}
