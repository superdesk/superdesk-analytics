UserSelect.$inject = ['lodash'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.search
 * @name sdaUserSelect
 * @requires lodash
 * @description A directive that provides user filters
 */
export function UserSelect(_) {
    return {
        scope: {
            users: '=',
            params: '=',
            errors: '=',
            min: '=?',
            max: '=?',
            required: '=',
        },
        template: require('../views/user-select.html'),
        link: function(scope) {
            /**
             * @ngdoc property
             * @name sdaUserSelect#source
             * @type {Object}
             * @description The list of available users and the currently selected ones
             */
            scope.source = {
                items: _.get(scope, 'users', []).filter(
                    (user) => (
                        _.get(user, 'is_active') &&
                        _.get(user, 'is_enabled') &&
                        !_.get(user, 'needs_activation')
                    )
                ),
                selected: [],
            };

            /**
             * @ngdoc method
             * @name sdaUserSelect#onParamsChanged
             * @description Updates the list of selected users when the supplied parameters change
             */
            scope.onParamsChanged = () => {
                scope.source.selected = scope.params ? [{_id: scope.params}] : [];
            };

            /**
             * @ngdoc method
             * @name sdaUserSelect#onInputChanged
             * @description Updates the supplied parameters when the selected users change
             */
            scope.onInputChanged = () => {
                scope.params = _.get(scope.source.selected, '[0]._id', null);
            };

            scope.onParamsChanged();
        },
    };
}
