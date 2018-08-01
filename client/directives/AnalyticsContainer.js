/**
 * @ngdoc directive
 * @module superdesk.apps.analytics
 * @name sdAnalyticsContainer
 * @description A directive that encapsulates the entire analytics module view
 */
export function AnalyticsContainer() {
    return {
        controllerAs: 'analytics',
        controller: ['$scope', '$location', 'pageTitle', 'gettext', 'lodash', 'reports', '$rootScope',
            function AnalyticsContainerController($scope, $location, pageTitle, gettext, _, reports, $rootScope) {
                const defaultReportConfigs = {charts: []};

                $scope.reports = reports;
                $scope.flags = $scope.flags || {};
                $scope.flags.showSidePanel = false;
                $scope.currentReport = {};
                $scope.reportConfigs = $scope.reportConfigs || _.cloneDeep(defaultReportConfigs);

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

                init();
            },
        ],
    };
}
