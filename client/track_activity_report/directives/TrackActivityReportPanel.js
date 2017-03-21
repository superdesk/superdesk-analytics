TrackActivityReportPanel.$inject = [
    'config', 'api', 'session', 'notify', '$rootScope', 'desks'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.track-activity-report
 * @name sdTrackActivityReportPanel
 * @requires config
 * @requires api
 * @requires session
 * @requires notify
 * @requires $rootScope
 * @requires desks
 * @description A directive that generates the sidebar containing track activity report parameters
 */
export function TrackActivityReportPanel(config, api, session, notify, $rootScope, desks) {
    return {
        template: require('../views/track-activity-report-panel.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            /**
             * @ngdoc method
             * @name sdTrackActivityReportPanel#init
             * @description Initialises the track activity report object
             */
            scope.initalize = function() {
                var currentDesk = desks.getCurrentDesk();

                scope.desks = desks.desks._items;
                scope.stages = null;
                scope.selectedUser = null;
                scope.report = {};
                if (currentDesk) {
                    scope.report = {desk: currentDesk._id, stage: currentDesk.working_stage};
                    scope.stages = desks.deskStages[currentDesk._id];
                } else {
                    scope.report = {};
                }
            };

            scope.$watch('report.desk', (deskId, oldDeskId) => {
                if (deskId !== oldDeskId) {
                    if (deskId) {
                        scope.stages = desks.deskStages[deskId];
                    } else {
                        scope.stages = null;
                    }
                    scope.report.stage = null;
                }
            });

            /**
             * @ngdoc method
             * @name sdTrackActivityReportPanel#searchUsers
             * @param {String} text
             * @description Searches users based on given text
             */
            scope.searchUsers = function(text) {
                var query = {
                    $or: [
                        {username: {$regex: text, $options: '-i'}},
                        {display_name: {$regex: text, $options: '-i'}},
                        {email: {$regex: text, $options: '-i'}}
                    ]
                };

                api.users.query(query).then((users) => {
                    scope.users = users._items;
                });
                return scope.users;
            };

            /**
             * @ngdoc method
             * @name sdTrackActivityReportPanel#selectUser
             * @param {Object} user
             * @description Sets the selected user
             */
            scope.selectUser = function(user) {
                scope.selectedUser = user;
                scope.report.user = user._id;
            };

            /**
             * @ngdoc method
             * @name sdTrackActivityReportPanel#removeUser
             * @description Removes the selected user
             */
            scope.removeUser = function() {
                scope.selectedUser = null;
                scope.report.user = null;
            };

            /**
             * @ngdoc method
             * @name sdTrackActivityReportPanel#generate
             * @description Generate the report
             */
            scope.generate = function() {
                function onSuccess(trackActivityReport) {
                    $rootScope.$broadcast('view:track_activity_report', trackActivityReport);
                    notify.success(gettext('The track activity report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The track activity report could not be generated.'));
                    }
                }

                api('track_activity_report', session.identity).save({}, scope.report)
                    .then(onSuccess, onFail);
            };

            scope.validForm = function() {
                return scope.trackActivityReportForm.$valid && scope.selectedUser;
            };

            scope.initalize();
        }
    };
}
