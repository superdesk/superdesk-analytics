angular.module('superdesk.apps.aggregate.widgets', ['superdesk.apps.aggregate', 'superdesk.apps.dashboard.widgets'])
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('aggregate', {
            label: 'Analytics',
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 3,
            sizex: 1,
            sizey: 2,
            thumbnail: 'scripts/apps/analytics/analytics-widget/activity-thumbnail.svg',
            template: 'scripts/apps/monitoring/analytics-widget/analytics-widget.html',
            configurationTemplate: 'scripts/apps/analytics/analytics-widget/configuration.html',
            description: 'This widget allows you to view the analytics reports',
            custom: true
        });
    }]);
    .controller('AnalyticsController', ['$scope', '$timeout', 'api',
        function($scope, $timeout, api) {
            function updateData() {
                api.analytics.query().then((items) => {
                    $scope.items = items;

                    $timeout(() => {
                        updateData();
                    }, $scope.widget.configuration.updateInterval * 1000 * 60);
                });
            }

            updateData();
        }])
    .controller('AnalyticsController', ['$scope', 'colorSchemes',
        function($scope, colorSchemes) {
            colorSchemes.get((colorsData) => {
                $scope.schemes = colorsData.schemes;
            });
        }]);
