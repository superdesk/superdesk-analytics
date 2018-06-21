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

        toDelete.forEach((field) => {
            delete query[field];
        });

        return api('processed_items_report', session.identity).save({}, query);
    };
}
