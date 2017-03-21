TrackActivityReportView.$inject = [];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.track-activity-report
 * @name sdTrackActivityReportView
 * @description A directive that displays the generated track activity report
 */
export function TrackActivityReportView() {
    return {
        template: require('../views/track-activity-report-view.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.$on('view:track_activity_report', (event, args) => {
                scope.trackActivityReport = args;
            });

            /**
             * @ngdoc method
             * @name sdTrackActivityReportView#formatDate
             * @param {String} date
             * @description Format given date for generate
             */
            scope.formatDate = function(date) {
                return date ? moment(date).format('YYYY-MM-DD HH:mm') : null; // jshint ignore:line
            };
        }
    };
}
