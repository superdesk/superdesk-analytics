ItemTimelineTooltip.$inject = ['moment'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.user-activity-report
 * @name ItemTimelineTooltip
 * @requires moment
 * @description Directive that renders the tooltip to be used in the item timeline report
 */
export function ItemTimelineTooltip(moment) {
    return {
        template: require('../views/item-timeline-tooltip.html'),
        link: function(scope) {
            scope.datetime = moment.unix(scope.timestamp / 1000).format('LLLL');
        },
    };
}
