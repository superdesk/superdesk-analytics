ProcessedItemsReport.$inject = ['api', 'session', 'config', '$q'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.processed-items-report
 * @name ProcessedItemsReport
 * @requires api
 * @requires session
 * @requires config
 * @requires $q
 * @description Processed items report service
 */
export function ProcessedItemsReport(api, session, config, $q) {
    var toDelete = ['_id', '_etag'];

    /**
     * @ngdoc method
     * @name ProcessedItemsReport#generate
     * @param {Object} reportParams
     * @returns {Promise}
     * @description Generate the report
     */
    this.generate = function(reportParams) {
        if (!reportParams) {
            return $q.reject('Invalid report parameters');
        }

        var query = _.clone(reportParams);

        try {
            query.start_time = formatDate(reportParams.start_time);
            query.end_time = formatDate(reportParams.end_time, 1);
        } catch (e) {
            return $q.reject();
        }
        toDelete.forEach((field) => {
            delete query[field];
        });

        return api('processed_items_report', session.identity).save({}, query);
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsReport#formatDate
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
