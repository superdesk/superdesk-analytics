import {formatDateForServer} from '../../utils';

ActivityReport.$inject = ['api', 'session', 'config', '$q', 'moment'];

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
export function ActivityReport(api, session, config, $q, moment) {
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
            query.operation_end_date = formatDateForServer(moment, config, activityReport.operation_end_date, 1);
        } catch (e) {
            return $q.reject();
        }
        toDelete.forEach((field) => {
            delete query[field];
        });

        return api('activity_report', session.identity).save({}, query);
    };
}
