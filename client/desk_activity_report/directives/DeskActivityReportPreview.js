DeskActivityReportPreview.$inject = ['desks', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.desk-activity-report
 * @name DeskActivityReportPreview
 * @requires desks
 * @requires lodash
 * @description Directive to render the preview for DeskActivity report in Schedules page
 */
export function DeskActivityReportPreview(desks, _) {
    return {
        template: require('../views/desk-activity-report-preview.html'),
        link: function(scope) {
            desks.initialize()
                .then(() => {
                    const params = _.get(scope, 'report.params') || {};

                    scope.deskName = _.get(desks.deskLookup, `[${params.desk}].name`) || '-';
                });
        },
    };
}
