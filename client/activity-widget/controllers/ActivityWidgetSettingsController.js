ActivityWidgetSettingsController.$inject = ['$scope', 'desks', '$rootScope', 'analyticsWidgetSettings', 'metadata',
    'WizardHandler', 'activityReportWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.activity-widget
 * @name ActivityWidgetSettingsController
 * @requires $scope
 * @requires desks
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @requires metadata
 * @requires WizardHandler
 * @requires activityReportWidgetSettings
 * @description Controller for activity widget settings dialog
 */
export function ActivityWidgetSettingsController($scope, desks, $rootScope, analyticsWidgetSettings, metadata,
    WizardHandler, activityReportWidgetSettings) {
    $scope.currentDesk = desks.getCurrentDesk();

    desks.initialize().then(() => {
        $scope.desks = desks.desks._items;
    });

    metadata.initialize().then(() => {
        $scope.metadata = metadata.values;
    });

    /**
     * @ngdoc method
     * @name ActivityWidgetSettingsController#setCurrentStep
     * @description Sets current step in wizard, default is 'operation'.
     */
    $scope.setCurrentStep = function() {
        $scope.step = {
            current: $scope.currentStep || 'operation',
        };
    };

    /**
     * @ngdoc method
     * @name ActivityWidgetSettingsController#previous
     * @description Sets previous step in wizard.
     */
    $scope.previous = function() {
        WizardHandler.wizard('activity-report').previous();
    };

    /**
     * @ngdoc method
     * @name ActivityWidgetSettingsController#next
     * @description Sets next step in wizard.
     */
    $scope.next = function() {
        WizardHandler.wizard('activity-report').next();
    };

    /**
     * @ngdoc method
     * @name ActivityWidgetSettingsController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        $scope.widget = activityReportWidgetSettings.getSettings($scope.widget.multiple_id);
        if (!$scope.widget) {
            $scope.widget = widget;
            activityReportWidgetSettings.saveSettings($scope.widget);
        }
        if (!$scope.widget.configuration) {
            $scope.widget.configuration = {operation: 'publish', days: 1};
            if ($scope.currentDesk) {
                $scope.widget.configuration.desk = $scope.currentDesk._id;
            }
        }
    };

    /**
     * @ngdoc method
     * @name ActivityWidgetSettingsController#cancel
     * @description Closes the settings dialog
     */
    $scope.cancel = function() {
        $scope.$close();
    };

    /**
     * @ngdoc method
     * @name ActivityWidgetSettingsController#save
     * @description Saves the settings and closes the dialog
     */
    $scope.save = function() {
        analyticsWidgetSettings.saveSettings($scope.widget)
        .then((settings) => {
            activityReportWidgetSettings.saveSettings($scope.widget);
            $rootScope.$broadcast('view:activity_widget', $scope.widget);
        });
        $scope.$close();
    };

    $scope.setCurrentStep();
}
