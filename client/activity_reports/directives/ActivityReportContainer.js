/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdActivityReportContainer
 * @description Container directive
 */
export function ActivityReportContainer() {
    console.log('container');
    return {
        controller: ['gettext', 'pageTitle',
            function ActivityReportContainerController(gettext, pageTitle) {
                pageTitle.setUrl(gettext('Activity Report'));
            }
        ]
    };
}
