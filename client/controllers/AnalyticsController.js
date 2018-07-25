AnalyticsController.$inject = ['$scope', '$rootScope', 'gettext'];
export function AnalyticsController($scope, $rootScope, gettext) {
    $scope.reports = [{id: 'activity-report', name: gettext('Activity Report')},
        {id: 'processed-items-report', name: gettext('Processed Items Report')},
        {id: 'track-activity-report', name: gettext('Track Activity Report')},
        {id: 'content-quota-report', name: gettext('Content Quota Report')},
        {id: 'source-category-report', name: gettext('Source Category Report')},
    ];

    $scope.currentReport = $scope.reports[0];

    $scope.changeReport = function(report) {
        $scope.currentReport = report;
    };

    $scope.filtersOpen = true;

    $scope.toggleFilters = function() {
        $scope.filtersOpen = !$scope.filtersOpen;

        $rootScope.$broadcast('analytics:toggle-filters');
    };
}
