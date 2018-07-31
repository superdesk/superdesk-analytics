TrackActivityWidgetSettingsController.$inject = ['$scope', 'desks', 'api', '$rootScope',
    'analyticsWidgetSettings', 'trackActivityReportWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.track-activity-widget
 * @name TrackActivityWidgetSettingsController
 * @requires $scope
 * @requires desks
 * @requires api
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @requires trackActivityReportWidgetSettings
 * @description Controller for track activity widget settings dialog
 */
export function TrackActivityWidgetSettingsController($scope, desks, api, $rootScope, analyticsWidgetSettings,
    trackActivityReportWidgetSettings) {
    $scope.currentDesk = desks.getCurrentDesk();
    $scope.desks = desks.desks._items;

    $scope.users = [];

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        $scope.widget = trackActivityReportWidgetSettings.getSettings($scope.widget.multiple_id);
        if (!$scope.widget) {
            $scope.widget = widget;
            trackActivityReportWidgetSettings.saveSettings($scope.widget);
        }
        if (!$scope.widget.configuration) {
            $scope.widget.configuration = {days_ago: 1};
            if ($scope.currentDesk) {
                $scope.widget.configuration.desk = $scope.currentDesk._id;
                $scope.widget.configuration.stage = $scope.currentDesk.working_stage;
            }
        }
        if ($scope.widget.configuration && $scope.widget.configuration.desk) {
            $scope.stages = $scope.widget.configuration.desk ?
                desks.deskStages[$scope.widget.configuration.desk] : null;
        }
        if ($scope.widget.configuration && $scope.widget.configuration.user) {
            $scope.selectedUser = desks.userLookup[$scope.widget.configuration.user];
        }
    };

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
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#selectUser
     * @param {Object} user
     * @description Sets the selected user
     */
    $scope.selectUser = function(user) {
        $scope.selectedUser = user;
        $scope.widget.configuration.user = user._id;
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetSettingsController#removeUser
     * @description Removes the selected user
     */
    $scope.removeUser = function() {
        $scope.selectedUser = null;
        $scope.widget.configuration.user = null;
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
        analyticsWidgetSettings.saveSettings($scope.widget)
        .then((settings) => {
            trackActivityReportWidgetSettings.saveSettings($scope.widget);
            $rootScope.$broadcast('view:track_activity_widget', $scope.widget);
        });
        $scope.$close();
    };

    $scope.$watch('widget.configuration.desk', (deskId, oldDeskId) => {
        if (deskId !== oldDeskId) {
            $scope.stages = deskId ? desks.deskStages[deskId] : null;
            $scope.widget.configuration.stage = null;
        }
    });
}
