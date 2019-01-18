ProcessedItemsReportForm.$inject = ['api', 'notify', '$rootScope', 'processedItemsReport'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.processed-items-form
 * @name sdProcessedItemsReportForm
 * @requires notify
 * @requires $rootScope
 * @description A directive that generates the form containing processed items report parameters
 */
export function ProcessedItemsReportForm(api, notify, $rootScope, processedItemsReport) {
    return {
        template: require('../views/processed-items-report-form.html'),
        scope: {
            validForm: '=',
            report: '=',
        },
        link: function(scope, element, attrs, controller) {
            if (!scope.report) {
                scope.report = {};
            }
            if (!scope.report.time_interval) {
                scope.report.time_interval = {measure: 'days', count: 1};
            }
            if (!scope.report.users) {
                scope.report.users = [];
            }
            scope.measures = ['days', 'hours'];
            scope.validForm = false;

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportForm#searchUsers
             * @param {String} text
             * @returns {Array}
             * @description Searches users based on given text
             */
            scope.searchUsers = function(text) {
                var query = {
                    $or: [
                        {username: {$regex: text, $options: '-i'}},
                        {display_name: {$regex: text, $options: '-i'}},
                        {email: {$regex: text, $options: '-i'}},
                    ],
                };

                api.users.query(query).then((users) => {
                    scope.users = users._items;
                });
                return scope.users;
            };
            /**
             * @ngdoc method
             * @name sdProcessedItemsReportForm#isSelected
             * @param {Object} user
             * @returns {Boolean}
             * @description Checks if a user is already selected
            */
            scope.isSelected = function(user) {
                for (var i = scope.report.users.length; i--;) {
                    if (scope.report.users[i]._id === user._id) {
                        return true;
                    }
                }
                return false;
            };
            /**
             * @ngdoc method
             * @name sdProcessedItemsReportForm#selectUser
             * @param {Object} user
             * @description Sets the selected user
             */
            scope.selectUser = function(user) {
                if (scope.isSelected(user) === false) {
                    scope.report.users.push({
                        display_name: user.display_name,
                        _id: user._id,
                    });
                    scope.validateForm();
                }
            };

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportForm#removeUser
             * @description Removes the selected user
             */
            scope.removeUser = function(item) {
                for (var i = scope.report.users.length; i--;) {
                    if (scope.report.users[i] === item) {
                        scope.report.users.splice(i, 1);
                        scope.validateForm();
                    }
                }
            };

            /**
             * @ngdoc method
             * @name sdProcessedItemsReportForm#validateForm
             * @returns {Boolean}
             * @description Return true if the form is valid
             */
            scope.validateForm = function() {
                scope.validForm = scope.processedItemsReportForm.$valid && scope.report.users.length > 0;
            };
        },
    };
}