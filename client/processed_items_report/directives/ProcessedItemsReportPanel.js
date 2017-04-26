ProcessedItemsReportPanel.$inject = [
    'config', 'api', 'session', 'notify', '$rootScope', 'processedItemsReport'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-report
 * @name sdProcessedItemsReportPanel
 * @requires config
 * @requires api
 * @requires session
 * @requires notify
 * @requires $rootScope
 * @description A directive that generates the sidebar containing processed items report parameters
 */
export function ProcessedItemsReportPanel(config, api, session, notify, $rootScope, processedItemsReport) {
    return {
        template: require('../views/processed-items-report-panel.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            /**
             * @ngdoc method
             * @name sdProcessedItemsReportPanel#init
             * @description Initialises the processed items report object
             */
            scope.init = function() {
                scope.selectedUsers = [];
            };

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportPanel#searchUsers
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
             * @name sdProcessedItemsReportPanel#isSelected
             * @param {Object} user
             * @description Checks if a user is already selected
            */
            scope.isSelected = function(user) {
                for(var i = scope.selectedUsers.length; i--;){
                    if(scope.selectedUsers[i]._id === user._id){
                        return true;
                    }
                }
                return false;
            };
            /**
             * @ngdoc method
             * @name sdProcessedItemsReportPanel#selectUser
             * @param {Object} user
             * @description Sets the selected user
             */
            scope.selectUser = function(user) {
                if(scope.isSelected(user) === false){
                    scope.selectedUsers.push({
                        display_name: user.display_name,
                        _id: user._id
                    });
                }
            };

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportPanel#removeUser
             * @description Removes the selected user
             */
            scope.removeUser = function(item) {
                for (var i = scope.selectedUsers.length; i--;) {
                    if (scope.selectedUsers[i] === item) {
                        scope.selectedUsers.splice(i, 1);
                    }
                }
            };

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportPanel#generate
             * @description Generate the report
             */
            scope.generate = function() {
                function onSuccess(processedItemsReport) {
                    $rootScope.$broadcast('view:processed_items_report', processedItemsReport);
                    notify.success(gettext('The processed items report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The processed items report could not be generated.'));
                    }
                }
                var query = {start_time: formatDate(scope.start_time), end_time: formatDate(scope.end_time),
                    users: scope.selectedUsers};
                processedItemsReport.generate(query).then(onSuccess, onFail);

            };

            scope.validForm = function() {
                return scope.processedItemsReportForm.$valid && scope.selectedUsers;
            };

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportPanel#formatDate
             * @param {String} date
             * @description Format given date for generate
             */
            function formatDate(date) {
                return date ? moment(date, config.model.dateformat).format('YYYY-MM-DD') : null; // jshint ignore:line
            }
            scope.init();
        }
    };
}