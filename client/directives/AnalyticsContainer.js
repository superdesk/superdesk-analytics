/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdaAnalyticsContainer
 * @requires $location
 * @requires pageTitle
 * @requires gettext
 * @requires lodash
 * @requires reports
 * @requires $rootScope
 * @requires $timeout
 * @requires emailReport
 * @required savedReports
 * @required api
 * @required desks
 * @required metadata
 * @required searchReport
 * @description A directive that encapsulates the entire analytics module view
 */
export function AnalyticsContainer() {
    return {
        controllerAs: 'analytics',
        controller: ['$scope', '$location', 'pageTitle', 'gettext', 'lodash', 'reports', '$rootScope', '$timeout',
            'emailReport', 'savedReports', 'api', 'desks', 'metadata', 'searchReport',
            function AnalyticsContainerController(
                $scope,
                $location,
                pageTitle,
                gettext,
                _,
                reports,
                $rootScope,
                $timeout,
                emailReport,
                savedReports,
                api,
                desks,
                metadata,
                searchReport
            ) {
                const defaultReportConfigs = {charts: []};

                $scope.reports = reports;
                $scope.flags = $scope.flags || {};
                $scope.flags.showSidePanel = false;
                $scope.flags.contentView = $scope.flags.contentView || 'report';
                $scope.currentReport = {};
                $scope.reportConfigs = $scope.reportConfigs || _.cloneDeep(defaultReportConfigs);
                $scope.currentPanel = 'advanced';
                $scope.currentTab = 'parameters';
                $scope.emailModal = emailReport.modal;
                $scope.preview = {
                    item: null,
                    type: null,
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#init
                 * @description Init the container members/values
                 */
                const init = () => {
                    // Set the Report based on URL parameters
                    $scope.changeReport(
                        _.find($scope.reports, ['id', $location.search().report]) || $scope.reports[0],
                        false
                    );

                    // Initialise desk and metadata for archive previews
                    desks.initialize();
                    metadata.initialize();
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#changeReport
                 * @param {object} report - The registered report to change to
                 * @param {Boolean} deselectSavedReport - Deselects SavedReport if true (false on initial load)
                 * @description Changes the current report
                 */
                $scope.changeReport = (report, deselectSavedReport = true) => {
                    // If the report type has not changed, then don't do anything
                    if (_.get(report, 'id') === _.get($scope.currentReport, 'id')) {
                        return;
                    }

                    $scope.currentReport = report || null;
                    $scope.reportConfigs = _.cloneDeep(defaultReportConfigs);
                    $scope.currentPanel = 'advanced';
                    $scope.currentTab = 'parameters';

                    if (_.get(report, 'id')) {
                        $location.search('report', report.id);
                        $scope.flags.showSidePanel = _.get(report, 'showSidePanel', true);
                    } else {
                        $location.search('report', null);
                        $scope.flags.showSidePanel = false;
                    }

                    // Deselect any saved report
                    if (deselectSavedReport) {
                        savedReports.selectReport({});
                        $scope.clearSavedReportForSchedule();
                    }
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#toggleSidePanel
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
                 * @name sdaAnalyticsContainer#changeReportParams
                 * @param {Object} params - The report parameters
                 * @description Changes the current report parameters used to generate the charts
                 */
                $scope.changeReportParams = (params = null) => {
                    $scope.reportConfigs = params || _.cloneDeep(defaultReportConfigs);
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#changeContentViewThenSendBroadcast
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
                 * @name sdaAnalyticsContainer#openCreateScheduleModal
                 * @description Sends a broadcast for sda-scheduled-reports-list to show the
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
                 * @name sdaAnalyticsContainer#viewSchedule
                 * @param {Object} savedReport - Filter schedules based on this saved report
                 * @description Changes the content view to view the report schedules
                 * Then sends a broadcast for sda-scheduled-reports-list to show the schedules
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
                 * @name sdaAnalyticsContainer#changeContentView
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
                 * @name sdaAnalyticsContainer#clearSavedReportForSchedule
                 * @description Clears the current saved report for use with the schedules
                 * (i.e. removes the saved report filter and shows all schedules for current report type)
                 */
                $scope.clearSavedReportForSchedule = () => {
                    $scope.savedReportForSchedule = null;
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#createNewSchedule
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
                 * @name sdaAnalyticsContainer#viewSchedules
                 * @param {Object} savedReport - The saved report to filter schedules for
                 * @description Show the schedule view and filter them by the provided saved report
                 */
                $scope.viewSchedules = (savedReport) => {
                    $scope.changeContentView('schedules', savedReport);
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#changePanel
                 * @param {String} panelName - The name of the panel to change to
                 * @description Changes the current outter tab (panel) to use in the side panel
                 */
                $scope.changePanel = (panelName) => {
                    $scope.currentPanel = panelName;
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#closePreview
                 * @description Closes the preview panel
                 */
                $scope.closePreview = () => {
                    $scope.preview = {
                        item: null,
                        type: null,
                    };
                };

                /**
                 * @ngdoc
                 * @name sdaAnalyticsContainer#openPreview
                 * @param {Object} item - The item to preview
                 * @param {String} type - The type of the item (used with sda-archive-preview-proxy)
                 * @description Opens the preview panel with the appropriate preview directive based on type
                 */
                $scope.openPreview = (item, type = 'archive') => {
                    $scope.preview = {
                        item: item,
                        type: type,
                    };
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#changeTab
                 * @param {String} tabName - The name of the tab to change to
                 * @description Change the current tab in the filters panel
                 */
                $scope.changeTab = (tabName) => {
                    $scope.currentTab = tabName;
                };

                /**
                 * @ngdoc method
                 * @name sdaAnalyticsContainer#runQuery
                 * @param {Object} params - The report parameters used to search the data
                 * @return {Object}
                 * @description Queries the DeskActivityReport API and returns it's response
                 */
                $scope.runQuery = (params) => searchReport.query(
                    _.get($scope.currentReport, 'id'),
                    params,
                    true
                );

                init();
            },
        ],
    };
}
