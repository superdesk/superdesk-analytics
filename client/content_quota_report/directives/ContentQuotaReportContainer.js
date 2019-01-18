/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-quota-report
 * @name sdContentQuotaReportContainer
 * @description Container directive
 */
export function ContentQuotaReportContainer() {
    return {
        controller: ['gettext', 'pageTitle',
            function ContentQuotaReportContainerController(gettext, pageTitle) {
                pageTitle.setUrl(gettext('Content Quota Report'));
            },
        ],
    };
}
