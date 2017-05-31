TrackActivityReport.$inject = ['api', 'session', '$q'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.track-activity-report
 * @name TrackActivityReport
 * @requires api
 * @requires session
 * @description Track activity report service
 */
export function TrackActivityReport(api, session, $q) {
    var toDelete = ['_id', '_etag', 'report'];

    /**
     * @ngdoc method
     * @name TrackActivityReport#generate
     * @param {Object} reportParams
     * @description Generate the report
     */
    this.generate = function(reportParams) {
        if (!reportParams) {
            return $q.reject('Invalid report parameters');
        }
        toDelete.forEach((field) => {
            delete reportParams[field];
        });
        return api('track_activity_report', session.identity).save({}, reportParams)
            .then((report) => report);
    };
}
