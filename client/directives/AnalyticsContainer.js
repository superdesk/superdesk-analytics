/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdAnalyticsContainer
 * @requires $location
 * @requires pageTitle
 * @requires gettext
 * @requires lodash
 * @requires reports
 * @requires $rootScope
 * @requires $timeout
 * @description A directive that encapsulates the entire analytics module view
 */
export function AnalyticsContainer() {
    return {
        controllerAs: 'analytics',
        controller: ['$scope', '$location', 'pageTitle', 'gettext', 'lodash', 'reports', '$rootScope', '$timeout',
            function AnalyticsContainerController(
                $scope,
                $location,
                pageTitle,
                gettext,
                _,
                reports,
                $rootScope,
                $timeout
            ) {
                const defaultReportConfigs = {charts: []};

                $scope.reports = reports;
                $scope.flags = $scope.flags || {};
                $scope.flags.showSidePanel = false;
                $scope.flags.contentView = $scope.flags.contentView || 'report';
                $scope.currentReport = {};
                $scope.reportConfigs = $scope.reportConfigs || _.cloneDeep(defaultReportConfigs);
                $scope.currentPanel = 'advanced';

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#init
                 * @description Init the container members/values
                 */
                const init = () => {
                    // Set the Report based on URL parameters
                    $scope.changeReport(
                        _.find($scope.reports, ['id', $location.search().report]) || $scope.reports[0]
                    );
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#changeReport
                 * @param {object} report - The registered report to change to
                 * @description Changes the current report
                 */
                $scope.changeReport = (report) => {
                    if (_.get(report, 'id') === _.get($scope.currentReport, 'id')) {
                        return;
                    }

                    $scope.currentReport = report || null;
                    $scope.reportConfigs = _.cloneDeep(defaultReportConfigs);
                    $scope.currentPanel = 'advanced';

                    if (_.get(report, 'id')) {
                        $location.search('report', report.id);
                        $scope.flags.showSidePanel = _.get(report, 'showSidePanel', true);
                    } else {
                        $location.search('report', null);
                        $scope.flags.showSidePanel = false;
                    }
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#toggleSidePanel
                 * @description Shows/hides the side panel
                 */
                $scope.toggleSidePanel = () => {
                    if (_.get($scope.currentReport, 'id')) {
                        $scope.flags.showSidePanel = !$scope.flags.showSidePanel;
                        $rootScope.$broadcast('analytics:toggle-filters');
                    }
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#changeReportParams
                 * @param {Object} params - The report parameters
                 * @description Changes the current report parameters used to generate the charts
                 */
                $scope.changeReportParams = (params = null) => {
                    $scope.reportConfigs = params || _.cloneDeep(defaultReportConfigs);
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#changeContentViewThenSendBroadcast
                 * @param {String} contentView - The name of the content view to change to
                 * @param {String} broadcast - The name to broadcast from this scope
                 * @param {Object} params - The saved report for the broadcast
                 * @description Changes the content view then sends the broadcast afterwards
                 */
                this.changeContentViewThenSendBroadcast = (contentView, broadcast, params = null) => {
                    if ($scope.flags.contentView === contentView) {
                        $scope.$broadcast(broadcast, params);
                    } else {
                        $scope.changeContentView(contentView, params);
                        // Give the schedules page time to load (there must be a better way than this)
                        $timeout(() => {
                            $scope.$broadcast(broadcast, params);
                        }, 0);
                    }
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#openCreateScheduleModal
                 * @description Sends a broadcast for sd-scheduled-reports-list to show the
                 * create new schedule modal
                 */
                $scope.openCreateScheduleModal = () => {
                    this.changeContentViewThenSendBroadcast(
                        'schedules',
                        'analytics:schedules:open_create_modal'
                    );
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#viewSchedule
                 * @param {Object} savedReport - Filter schedules based on this saved report
                 * @description Changes the content view to view the report schedules
                 * Then sends a broadcast for sd-scheduled-reports-list to show the schedules
                 * Which might show the create/edit modal
                 */
                $scope.viewSchedule = (savedReport) => {
                    this.changeContentViewThenSendBroadcast(
                        'schedules',
                        'analytics:schedules:view_schedule',
                        savedReport
                    );
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#changeContentView
                 * @param {String} viewName - The name of the content view
                 * @param {Object} savedReport - Filter schedules based on this saved report
                 * @description Changes the content view to view the report schedules
                 * (Only showing schedules for the provided saved report)
                 */
                $scope.changeContentView = (viewName, savedReport = null) => {
                    $scope.flags.contentView = viewName;
                    $scope.savedReportForSchedule = savedReport;
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#clearSavedReportForSchedule
                 * @description Clears the current saved report for use with the schedules
                 * (i.e. removes the saved report filter and shows all schedules for current report type)
                 */
                $scope.clearSavedReportForSchedule = () => {
                    $scope.savedReportForSchedule = null;
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#createNewSchedule
                 * @param {Object} savedReport
                 */
                $scope.createNewSchedule = (savedReport) => {
                    this.changeContentViewThenSendBroadcast(
                        'schedules',
                        'analytics:schedules:create_new',
                        savedReport
                    );
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#viewSchedules
                 * @param {Object} savedReport - The saved report to filter schedules for
                 * @description Show the schedule view and filter them by the provided saved report
                 */
                $scope.viewSchedules = (savedReport) => {
                    $scope.changeContentView('schedules', savedReport);
                };

                /**
                 * @ngdoc method
                 * @name sdAnalyticsContainer#changePanel
                 * @param {String} panelName - The name of the panel to change to
                 * @description Changes the current outter tab (panel) to use in the side panel
                 */
                $scope.changePanel = (panelName) => {
                    $scope.currentPanel = panelName;
                };

                init();
            },
        ],
    };
}
