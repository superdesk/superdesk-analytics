ProcessedItemsWidgetSettingsController.$inject = ['config', '$scope', 'api', '$rootScope',
    'analyticsWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.processed-items-widget
 * @name ProcessedItemsWidgetSettingsController
 * @requires config
 * @requires $scope
 * @requires api
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @description Controller for processed items widget settings dialog
 */
export function ProcessedItemsWidgetSettingsController(config, $scope, api, $rootScope, analyticsWidgetSettings) {
    var widgetType = 'processed_items';


    $scope.widget = {};

    $scope.selectedUsers = [];

    $scope.widget.users = [$scope.selectedUsers];

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#readSettings
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
     * @name ProcessedItemsWidgetSettingsController#searchUsers
     * @param {String} text
     * @description Searches users based on given text
     */
    $scope.searchUsers = function(text) {
        var query = {
            $or: [
                {username: {$regex: text, $options: '-i'}},
                {display_name: {$regex: text, $options: '-i'}},
                {email: {$regex: text, $options: '-i'}}
            ]
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
        for (var i = $scope.selectedUsers.length; i--;) {
            if ($scope.selectedUsers[i]._id === user._id) {
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
            $scope.selectedUsers.push({
                display_name: user.display_name,
                _id: user._id
            });
            $scope.widget.users = $scope.selectedUsers;
        }
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetSettingsController#removeUser
     * @param {Object} user
     * @description Removes the selected user
     */
    $scope.removeUser = function(user) {
        for (var i = $scope.selectedUsers.length; i--;) {
            if ($scope.selectedUsers[i] === user) {
                $scope.selectedUsers.splice(i, 1);
                $scope.widget.users.splice(i, 1);
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
        analyticsWidgetSettings.saveSettings(widgetType, $scope.widget)
            .then(() => {
                $rootScope.$broadcast('view:processed_items_widget');
            });
        $scope.$close();
    };
}
