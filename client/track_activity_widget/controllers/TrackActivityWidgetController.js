TrackActivityWidgetController.$inject = ['$scope'];
export function TrackActivityWidgetController($scope) {
    $scope.reports = [{id: 'activity-report', name: 'Activity Report'},
        {id: 'processed-items-report', name: 'Processed Items Report'},
        {id: 'track-activity-report', name: 'Track Activity Report'}];

    $scope.report = {};
}
