ContentQuotaReport.$inject = ['api', 'session'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.content-quota-report
 * @name ContentQuotaReport
 * @requires api
 * @requires session
 * @description Content Quota report service
 */
export function ContentQuotaReport(api, session) {
    /**
     * @ngdoc method
     * @name ContentQuotaReport#generate
     * @param {Object} reportParams
     * @description Generate the report
     */
    this.generate = function(reportParams) {
        return api('content_quota_report', session.identity).save({}, reportParams)
            .then((report) => report);
    };
}
