ProcessedItemsReport.$inject = ['api', 'session'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.processed-items-report
 * @name ProcessedItemsReport
 * @requires api
 * @requires session
 * @description Processed Items report service
 */
export function ProcessedItemsReport(api, session) {
    /**
     * @ngdoc method
     * @name ProcessedItemsReport#generate
     * @param {Object} query
     * @description Generate the report
     */
    this.generate = function(query) {
        return api('processed_items_report', session.identity).save({}, query)
            .then((report) => report);
    };
}