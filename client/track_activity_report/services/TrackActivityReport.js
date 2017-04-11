TrackActivityReport.$inject = ['api', 'session'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.track-activity-report
 * @name TrackActivityReport
 * @requires api
 * @requires session
 * @description Track activity report service
 */
export function TrackActivityReport(api, session) {
    /**
     * @ngdoc method
     * @name TrackActivityReport#generate
     * @param {Object} reportParams
     * @description Generate the report
     */
    this.generate = function(reportParams) {
        return api('track_activity_report', session.identity).save({}, reportParams)
            .then((report) => report);
    };
}
