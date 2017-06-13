ContentQuotaReport.$inject = ['api', 'session', 'config', '$q'];

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
export function ContentQuotaReport(api, session, config, $q) {
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

        if (query.start_time) {
            query.start_time = formatDate(query.start_time);
        }
        toDelete.forEach((field) => {
            delete query[field];
        });
        return api('content_quota_report', session.identity).save({}, query)
            .then((report) => report);
    };

    /**
     * @ngdoc method
     * @name ContentQuotaReport#formatDate
     * @param {String} date
     * @returns {String}|null
     * @description Format given date for generate
     */
    function formatDate(date, addDays) {
        if (date) {
            var timestamp = moment(date, config.model.dateformat, true);

            if (!timestamp.isValid()) {
                timestamp = moment(date);
            }
            timestamp = moment(timestamp)
            .subtract(moment().utcOffset(), 'minutes');

            if (addDays) {
                timestamp.add(addDays, 'days').subtract(1, 'seconds');
            }
            return timestamp.format('YYYY-MM-DDTHH:mm:ss');
        }
        return null;
    }
}
