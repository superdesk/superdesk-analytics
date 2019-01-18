ProcessedItemsWidgetSettingsController.$inject = ['$scope', 'api', '$rootScope', 'analyticsWidgetSettings',
    'processedItemsReportWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.processed-items-widget
 * @name ProcessedItemsWidgetSettingsController
 * @requires $scope
 * @requires api
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @requires processedItemsReportWidgetSettings
 * @description Controller for processed items widget settings dialog
 */
export function ProcessedItemsWidgetSettingsController($scope, api, $rootScope, analyticsWidgetSettings,
    processedItemsReportWidgetSettings) {
    let defaultReport = {time_interval: {measure: 'days', count: 1}, users: []};

    $scope.validForm = false;

    function isConfigurationInitialized(widget) {
        return widget && widget.configuration && widget.configuration.users && widget.configuration.time_interval;
    }

    /**
     * @ngdoc method
     * @name ActivityWidgetSettingsController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        $scope.widget = processedItemsReportWidgetSettings.getSettings($scope.widget.multiple_id);
        if ($scope.widget && !isConfigurationInitialized($scope.widget)) {
            $scope.widget.configuration = defaultReport;
        }
        if (!$scope.widget) {
            $scope.widget = widget;
            processedItemsReportWidgetSettings.saveSettings($scope.widget);
        }
        if (!$scope.widget.configuration) {
            $scope.widget.configuration = {users: []};
        }
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#searchUsers
     * @param {String} text
     * @description Searches users based on given text
     */
    $scope.searchUsers = function(text) {
        var query = {
            $or: [
                {username: {$regex: text, $options: '-i'}},
                {display_name: {$regex: text, $options: '-i'}},
                {email: {$regex: text, $options: '-i'}},
            ],
        };

        api.users.query(query).then((users) => {
            $scope.users = users._items;
        });
        return $scope.users;
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#isSelected
     * @param {Object} user
     * @description Checks if a user is already selected
    */
    $scope.isSelected = function(user) {
        for (var i = $scope.widget.configuration.users.length; i--;) {
            if ($scope.widget.configuration.users[i]._id === user._id) {
                return true;
            }
        }
        return false;
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#selectUser
     * @param {Object} user
     * @description Sets the selected user
     */
    $scope.selectUser = function(user) {
        if ($scope.isSelected(user) === false) {
            $scope.widget.configuration.users.push({
                display_name: user.display_name,
                _id: user._id,
            });
        }
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#removeUser
     * @param {Object} user
     * @description Removes the selected user
     */
    $scope.removeUser = function(user) {
        for (var i = $scope.widget.configuration.users.length; i--;) {
            if ($scope.widget.configuration.users[i] === user) {
                $scope.widget.configuration.users.splice(i, 1);
            }
        }
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#cancel
     * @description Closes the settings dialo
     */
    $scope.cancel = function() {
        $scope.$close();
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#save
     * @description Saves the settings and closes the dialog
     */
    $scope.save = function() {
        analyticsWidgetSettings.saveSettings($scope.widget)
        .then((settings) => {
            processedItemsReportWidgetSettings.saveSettings($scope.widget);
            $rootScope.$broadcast('view:processed_items_widget', $scope.widget);
        });
        $scope.$close();
    };
}
