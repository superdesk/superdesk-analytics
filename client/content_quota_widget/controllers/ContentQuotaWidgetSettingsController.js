ContentQuotaWidgetSettingsController.$inject = ['$scope', 'desks', 'api', '$rootScope',
    'analyticsWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.track-activity-widget
 * @name ContentQuotaWidgetSettingsController
 * @requires $scope
 * @requires desks
 * @requires api
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @description Controller for track activity widget settings dialog
 */
export function ContentQuotaWidgetSettingsController($scope, desks, api, $rootScope, analyticsWidgetSettings) {
    var widgetType = 'content_quota';

    $scope.widget = {};


    /**
     * @ngdoc method
     * @name ContentQuotaWidgetSettingsController#readSettings
     * @description Reads widget settings
     */
    var readSettings = function() {
        analyticsWidgetSettings.readSettings(widgetType).then((settings) => {
            $scope.widget = settings;
        });
    };

    readSettings();

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
        analyticsWidgetSettings.saveSettings(widgetType, $scope.widget)
            .then(() => {
                $rootScope.$broadcast('view:content_quota_widget');
            });
        $scope.$close();
    };
}
