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
        reports[report.id] = Object.assign({
            priority: 1000,
            privileges: {},
            showSidePanel: true,
            allowScheduling: false,
        }, report);
    };

    /**
     * @ngdoc method
     * @name ReportsProvider#$get
     * @description Returns the sorted list of registered Reports
     */
    this.$get = ['privileges', '$rootScope', function(privileges, $rootScope) {
        const filterReport = (report) => {
            // Filter this report if the user does not have the correct privileges
            if (!privileges.userHasPrivileges(report.privileges)) {
                return false;
            }

            // Filter this report if the required features are not enabled in Superdesk
            return _.every(report.required_features || [], (feature) => (
                Object.keys($rootScope.features).indexOf(feature) > -1
            ));
        };

        const filteredReports = _.sortBy(
            _.filter(
                _.values(reports),
                filterReport
            ),
            'priority'
        );

        // First entry is an empty entry, so if there is only 1 report registered
        // then there are no actual reports available;
        return filteredReports.length === 1 ? [] : filteredReports;
    }];

    this.addReport({id: null, priority: 0});
}
