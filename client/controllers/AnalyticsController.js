AnalyticsController.$inject = ['$scope', '$rootScope'];
export function AnalyticsController($scope, $rootScope) {
    $scope.reports = [{id: 'activity-report', name: 'Activity Report'},
        {id: 'processed-items-report', name: 'Processed Items Report'},
        {id: 'track-activity-report', name: 'Track Activity Report'},
        {id: 'content-quota-report', name: 'Content Quota Report'},
        {id: 'source-category-report', name: 'Source Category Report'}
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
