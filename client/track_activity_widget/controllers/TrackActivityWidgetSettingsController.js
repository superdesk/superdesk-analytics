TrackActivityWidgetSettingsController.$inject = ['$scope', 'desks', 'api', '$rootScope',
    'analyticsWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.track-activity-widget
 * @name TrackActivityWidgetSettingsController
 * @requires $scope
 * @requires desks
 * @requires api
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @description Controller for track activity widget settings dialog
 */
export function TrackActivityWidgetSettingsController($scope, desks, api, $rootScope, analyticsWidgetSettings) {
    var widgetType = 'track_activity',
        daysAgoDefault = 2;

    $scope.currentDesk = desks.getCurrentDesk();

    $scope.desks = desks.desks._items;

    $scope.users = [];

    $scope.widget = {days_ago: daysAgoDefault};

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#readSettings
     * @description Reads widget settings
     */
    var readSettings = function() {
        analyticsWidgetSettings.readSettings(widgetType).then((settings) => {
            $scope.widget = settings;
            $scope.stages = desks.deskStages[$scope.widget.desk];
            $scope.selectedUser = desks.userLookup[$scope.widget.user];
        });
    };

    readSettings();

    $scope.$watch('widget.desk', (deskId, oldDeskId) => {
        if (deskId !== oldDeskId) {
            $scope.stages = deskId ? desks.deskStages[deskId] : null;
            $scope.widget.stage = null;
        }
    });

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#searchUsers
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
     * @name TrackActivityWidgetSettingsController#selectUser
     * @param {Object} user
     * @description Sets the selected user
     */
    $scope.selectUser = function(user) {
        $scope.selectedUser = user;
        $scope.widget.user = user._id;
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#removeUser
     * @description Removes the selected user
     */
    $scope.removeUser = function() {
        $scope.selectedUser = null;
        $scope.widget.user = null;
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#cancel
     * @description Closes the settings dialog
     */
    $scope.cancel = function() {
        $scope.$close();
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#save
     * @description Saves the settings and closes the dialog
     */
    $scope.save = function() {
        analyticsWidgetSettings.saveSettings(widgetType, $scope.widget)
            .then(() => {
                $rootScope.$broadcast('view:track_activity_widget');
            });
        $scope.$close();
    };
}
