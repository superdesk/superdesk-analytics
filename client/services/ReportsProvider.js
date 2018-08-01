ReportsProvider.$inject = ['lodash'];

/**
 * @ngdoc provider
 * @module superdesk.apps.analytics
 * @name ReportsProvider
 * @requires lodash
 * @description This provider allows registering Reports
 */
export function ReportsProvider(_) {
    /**
     * @ngdoc property
     * @name ReportsProvider#reports
     * @type {Object}
     * @description List of registered reports, including a default empty report
     */
    let reports = {};

    /**
     * @ngdoc method
     * @name ReportsProvider#addReport
     * @param {Object} report - A config for the Report to register
     * @description Registers the provided report
     */
    this.addReport = function(report) {
        report.priority = _.get(report, 'priority', 1000);
        report.privileges = _.get(report, 'privileges', {});
        reports[report.id] = report;
    };

    /**
     * @ngdoc method
     * @name ReportsProvider#$get
     * @description Returns the sorted list of registered Reports
     */
    this.$get = ['privileges', function(privileges) {
        return _.sortBy(
            _.filter(
                _.values(reports),
                (report) => privileges.userHasPrivileges(report.privileges)
            ),
            'priority'
        );
    }];

    this.addReport({id: null, priority: 0});
}
