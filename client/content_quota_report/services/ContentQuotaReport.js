import {formatDateForServer} from '../../utils';

ContentQuotaReport.$inject = ['api', 'session', 'config', '$q', 'moment'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.content-quota-report
 * @name ContentQuotaReport
 * @requires api
 * @requires session
 * @requires config
 * @requires $q
 * @description Content quota report service
 */
export function ContentQuotaReport(api, session, config, $q, moment) {
    var toDelete = ['_id', '_etag', '_created', '_status', '_updated', '_links', 'report', 'timestamp'];

    /**
     * @ngdoc method
     * @name ContentQuotaReport#generate
     * @param {Object} reportParams
     * @description Generate the report
     */
    this.generate = function(reportParams) {
        if (!reportParams) {
            return $q.reject('Invalid report parameters');
        }
        var query = angular.copy(reportParams);

        if (query.end_date) {
            query.end_date = formatDateForServer(moment, config, query.end_date);
        }
        toDelete.forEach((field) => {
            delete query[field];
        });
        return api('content_quota_report', session.identity).save({}, query)
            .then((report) => report);
    };
}
