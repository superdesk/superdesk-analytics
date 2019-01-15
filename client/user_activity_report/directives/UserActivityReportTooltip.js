UserActivityReportTooltip.$inject = ['moment'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.user-activity-report
 * @name UserActivityReportTooltip
 * @requires moment
 * @description Directive that renders the tooltip to be used in the user activity report
 */
export function UserActivityReportTooltip(moment) {
    return {
        template: require('../views/user-activity-report-tooltip.html'),
        link: function(scope) {
            scope.start = moment.unix(scope.point.x / 1000).format('LT');
            scope.end = moment.unix(scope.point.x2 / 1000).format('LT');
        },
    };
}
