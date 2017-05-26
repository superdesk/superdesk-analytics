ActivityWidgetSettingsController.$inject = ['$scope', 'desks', '$rootScope', 'analyticsWidgetSettings', 'metadata',
    'WizardHandler', 'activityReport'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.activity-widget
 * @name ActivityWidgetSettingsController
 * @requires $scope
 * @requires desks
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @requires metadata
 * @description Controller for activity widget settings dialog
 */
export function ActivityWidgetSettingsController($scope, desks, $rootScope, analyticsWidgetSettings, metadata,
    WizardHandler, activityReport) {
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
            current: $scope.currentStep || 'operation'
        };
    };

    $scope.previous = function() {
        WizardHandler.wizard('activity-report').previous();
    };

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
        $scope.widget = activityReport.config || widget;
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
            activityReport.config = $scope.widget;
            $rootScope.$broadcast('view:activity_widget', $scope.widget);
        });
        $scope.$close();
    };
}
