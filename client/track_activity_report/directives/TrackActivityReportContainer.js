/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.track-activity-report
 * @name sdTrackActivityReportContainer
 * @description Container directive
 */
export function TrackActivityReportContainer() {
    return {
        controller: ['gettext', 'pageTitle',
            function TrackActivityReportContainerController(gettext, pageTitle) {
                pageTitle.setUrl(gettext('Track Activity Report'));
            },
        ],
    };
}
