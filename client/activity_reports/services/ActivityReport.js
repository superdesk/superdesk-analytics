ActivityReport.$inject = ['api', 'session', 'config', '$q'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.activity-report
 * @name ActivityReport
 * @requires api
 * @requires session
 * @requires config
 * @requires $q
 * @description Activity report service
 */
export function ActivityReport(api, session, config, $q) {
    var toDelete = ['_id', '_etag', 'is_global', 'owner', 'name', 'description'];

    /**
     * @ngdoc method
     * @name ActivityReport#generate
     * @param {Object} reportParams
     * @returns {Promise}
     * @description Generate the report
     */
    this.generate = function(activityReport) {
        if (!activityReport) {
            return $q.reject('Invalid report parameters');
        }

        var query = _.clone(activityReport);

        try {
            query.operation_start_date = formatDate(activityReport.operation_start_date);
            query.operation_end_date = formatDate(activityReport.operation_end_date, 1);
        } catch (e) {
            return $q.reject();
        }
        toDelete.forEach((field) => {
            delete query[field];
        });

        return api('activity_report', session.identity).save({}, query);
    };

    /**
     * @ngdoc method
     * @name ActivityReport#formatDate
     * @param {String} date
     * @returns {String}|null
     * @description Format given date for generate
     */
    function formatDate(date, addDays) {
        if (date) {
            var timestamp = moment(moment(date, config.model.dateformat))
            .subtract(moment().utcOffset(), 'minutes');

            if (addDays) {
                timestamp.add(addDays, 'days').subtract(1, 'seconds');
            }
            return timestamp.format('YYYY-MM-DDTHH:mm:ss');
        }
        return null;
    }
}
