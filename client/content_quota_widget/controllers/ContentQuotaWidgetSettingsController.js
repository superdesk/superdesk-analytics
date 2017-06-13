ContentQuotaWidgetSettingsController.$inject = ['$scope', 'desks', 'api', '$rootScope', 'analyticsWidgetSettings',
    'contentQuotaReportWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.track-activity-widget
 * @name ContentQuotaWidgetSettingsController
 * @requires $scope
 * @requires desks
 * @requires api
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @requires contentQuotaReportWidgetSettings
 * @description Controller for track activity widget settings dialog
 */
export function ContentQuotaWidgetSettingsController($scope, desks, api, $rootScope, analyticsWidgetSettings,
    contentQuotaReportWidgetSettings) {
    /**
     * @ngdoc method
     * @name ContentQuotaWidgetSettingsController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        $scope.widget = contentQuotaReportWidgetSettings.getSettings($scope.widget.multiple_id);
        if (!$scope.widget) {
            $scope.widget = widget;
            contentQuotaReportWidgetSettings.saveSettings($scope.widget);
        }
        if (!$scope.widget.configuration) {
            $scope.widget.configuration = {};
        }
    };

    /**
     * @ngdoc method
     * @name ContentQuotaWidgetSettingsController#cancel
     * @description Closes the settings dialog
     */
    $scope.cancel = function() {
        $scope.$close();
    };

    /**
     * @ngdoc method
     * @name ContentQuotaWidgetSettingsController#save
     * @description Saves the settings and closes the dialog
     */
    $scope.save = function() {
        analyticsWidgetSettings.saveSettings($scope.widget)
        .then((settings) => {
            contentQuotaReportWidgetSettings.saveSettings($scope.widget);
            $rootScope.$broadcast('view:content_quota_widget', $scope.widget);
        });
        $scope.$close();
    };
}
