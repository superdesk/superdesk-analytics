EmailRecipientsInput.$inject = ['userList', 'scheduledReports', '$q', 'lodash'];


/**
 * @ngdoc directive
 * @module superdesk.analytics.email_report
 * @name sdaEmailRecipientsInput
 * @requires userList
 * @requires scheduledReports
 * @requires $q
 * @requires lodash
 * @description A directive that renders as sd-tag-input with available email addresses
 */
export function EmailRecipientsInput(userList, scheduledReports, $q, _) {
    return {
        scope: {
            ngModel: '=',
            freetext: '=?',
        },
        require: 'ngModel',
        template: require('../views/email-recipients-input.html'),
        link: function(scope, element, attr, ngModel) {
            /**
             * @ngdoc method
             * @name EmailRecipientsInput#init
             * @description Initialise the list of emails and form input values
             */
            this.init = () => {
                scope.emails = {
                    ready: false,
                    list: [],
                    selected: [],
                };

                this.loadEmailList()
                    .then((emails) => {
                        scope.emails.list = emails;

                        this.setSelectedFromValue(ngModel.$viewValue || []);

                        scope.emails.ready = true;
                    });
            };

            /**
             * @ngdoc method
             * @name EmailRecipientsInput#loadEmailList
             * @description Loads list of emails from users and configured schedules
             */
            this.loadEmailList = () => (
                $q.all({
                    schedules: scheduledReports.fetchEmailList(),
                    users: userList.getAll(),
                })
                    .then((data) => {
                        const users = _.get(data, 'users') || [];
                        const schedules = _.get(data, 'schedules') || [];

                        let emails = users.map(
                            (user) => ({
                                address: _.get(user, 'email') || '',
                                name: (_.get(user, 'display_name') || '') +
                                    ' (' + (_.get(user, 'email') || '') + ')',
                            })
                        );

                        emails = emails.concat(
                            schedules.filter(
                                (email) => !_.find(users, (user) => user.email === email)
                            )
                                .map((email) => ({
                                    address: email,
                                    name: email,
                                }))
                        );

                        return _.sortBy(emails, 'name');
                    })
            );

            ngModel.$render = () => {
                if (!scope.emails.ready) {
                    return;
                }

                this.setSelectedFromValue(ngModel.$viewValue || []);
            };

            ngModel.$isEmpty = (value) => (
                _.get(value, 'length', 0) < 1
            );

            /**
             * @ngdoc method
             * @name EmailRecipientsInput#setSelectedFromValue
             * @param {Array} values - Array of values (from ng-model)
             * @description Sets the form input values based on the provided ng-model values
             */
            this.setSelectedFromValue = (values) => {
                scope.emails.selected = (_.get(scope, 'emails.list') || []).filter(
                    (email) => (
                        values.indexOf(email.address || email.name || email) >= 0
                    )
                );
            };

            /**
             * @ngdoc method
             * @name EmailRecipientsInput#setValueFromSelected
             * @description Sets the ng-model values based on the form input values
             */
            scope.setValueFromSelected = () => {
                ngModel.$setViewValue(
                    scope.emails.selected.map((email) => email.address || email.name || email)
                );
            };

            this.init();
        }
    };
}
