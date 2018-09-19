SavedReportList.$inject = [
    'savedReports',
    'desks',
    'privileges',
    'session',
    'modal',
    'gettext',
    'notify',
    'lodash',
    '$rootScope',
    '$timeout'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.saved_reports
 * @name sdSavedReportList
 * @requires savedReports
 * @requires desks
 * @requires privileges
 * @requires session
 * @requires modal
 * @requires gettext
 * @requires notify
 * @requires lodash
 * @requires $rootScope
 * @requires $timeout
 * @description A directive that renders 2 lists of saved reports (user and global saved reports)
 */
export function SavedReportList(
    savedReports,
    desks,
    privileges,
    session,
    modal,
    gettext,
    notify,
    _,
    $rootScope,
    $timeout
) {
    return {
        template: require('../views/saved-report-list.html'),
        scope: {
            reportType: '@',
            createNewSchedule: '=',
            viewSchedules: '=',
        },
        link: function(scope, element, attrs, controller) {
            /**
             * @ngdoc method
             * @name sdSavedReportList#init
             * @description Initialises the directive values
             */
            this.init = () => {
                scope.searchText = '';
                scope.userLookup = {};
                desks.initialize()
                    .then(() => {
                        scope.userLookup = desks.userLookup;
                    });

                scope.userReports = [];
                scope.filteredUserReports = [];
                scope.globalReports = [];
                scope.filteredGlobalReports = [];

                savedReports.fetchAll(scope.reportType)
                    .then((reports) => {
                        scope.userReports = reports.user;
                        scope.globalReports = reports.global;
                        scope.filter();
                    });

                scope.currentUser = session.identity._id;

                scope.localPrivilege = privileges.privileges.saved_reports === 1;
                scope.globalPrivilege = privileges.privileges.global_saved_reports === 1;

                scope.currentReport = savedReports.currentReport;
                scope.selectReport = savedReports.selectReport;

                // Focus the filter input element
                $timeout(() => {
                    element.find('input')
                        .first()
                        .focus();
                }, 0);
            };

            /**
             * @ngdoc method
             * @name sdSavedReportList#isReportSelected
             * @param {object} savedReport - The report to check
             * @return {boolean}
             * @description Returns true if the provided saved report is selected, false otherwise
             */
            scope.isReportSelected = (savedReport) => (
                _.get(scope.currentReport, '_id') === _.get(savedReport, '_id')
            );

            /**
             * @ngdoc method
             * @name sdSavedReportList#remove
             * @param {object} report - The report to remove
             * @return {Promise} - Resolves when the user confirms or cancels this action
             * @description Displays a confirmation modal to the user, removing the provided report upon confirmation
             */
            scope.remove = (report) => (
                modal.confirm(
                    gettext('Are you sure you want to delete the saved report?')
                ).then(() => (
                    savedReports.remove(report)
                ))
            );

            /**
             * @ngdoc method
             * @name sdSavedReportList#onSavedReportsUpdate
             * @param {object} event - The websocket event object
             * @param {object} data - The websocket data (saved report details)
             * @description Reload all saved reports of the current type when
             * a report is created/updated/deleted (from a websocket notification from the server)
             */
            this.onSavedReportsUpdate = function(event, data) {
                const reportType = _.get(data, 'report_type');

                if (reportType !== scope.reportType) {
                    return;
                }

                savedReports.fetchAll(scope.reportType)
                    .then((reports) => {
                        scope.userReports = reports.user;
                        scope.globalReports = reports.global;

                        scope.filter();
                    });
            };

            scope.filter = () => {
                if (scope.searchText || scope.searchText !== '') {
                    const searchString = scope.searchText.toLowerCase();
                    const filterReports = (report) => (
                        _.get(report, 'name', '')
                            .toLowerCase()
                            .indexOf(searchString) >= 0 ||
                        _.get(report, 'description', '')
                            .toLowerCase()
                            .indexOf(searchString) >= 0
                    );

                    scope.filteredUserReports = _.filter(scope.userReports, filterReports);
                    scope.filteredGlobalReports = _.filter(scope.globalReports, filterReports);
                } else {
                    scope.filteredUserReports = _.clone(scope.userReports);
                    scope.filteredGlobalReports = _.clone(scope.globalReports);
                }
            };

            // Watch the savedReports service for any changes
            const deregisterReportsUpdate = $rootScope.$on(
                'savedreports:update',
                angular.bind(this, this.onSavedReportsUpdate)
            );

            // Make sure to clean up the $rootScope event listener on directive destroy
            scope.$on('$destroy', deregisterReportsUpdate);

            this.init();
        },
    };
}
