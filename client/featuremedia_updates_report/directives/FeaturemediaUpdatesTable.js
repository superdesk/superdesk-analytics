import {appConfig} from 'appConfig';

import {getTranslatedOperations} from '../../utils';
import {searchReport} from '../../search/services/SearchReport';

FeaturemediaUpdatesTable.$inject = [
    'userList',
    'moment',
    'api',
    'lodash',
    'notify',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.featuremedia-updates-report
 * @name sdaFeaturemediaUpdatesTable
 * @requires userList
 * @requires moment
 * @requires api
 * @requires lodash
 * @requires notify
 * @description Directive to render the interactive featuremedia updates table
 */
export function FeaturemediaUpdatesTable(
    userList,
    moment,
    api,
    _,
    notify
) {
    return {
        replace: true,
        require: '^sdaAnalyticsContainer',
        template: require('../views/featuremedia-updates-table.html'),
        link: function(scope, element) {
            /**
             * @ngdoc method
             * @name sdaFeaturemediaUpdatesTable#init
             * @description Initialises the scope parameters and loads list of users
             */
            const init = () => {
                loadUsers();

                scope.selected = {preview: null};
                scope.itemUpdates = [];

                // Scroll to the top when the report configs change
                scope.$watch('reportConfigs.charts', () => {
                    element.parent().scrollTop(0);
                    scope.closePreview();
                    updateTable();
                });
            };

            /**
             * @ngdoc method
             * @name sdaFeaturemediaUpdatesTable#loadUsers
             * @description Loads the list of users and stores them in the scope
             */
            const loadUsers = () => {
                scope.users = {};

                userList.getAll()
                    .then((usersList) => {
                        scope.users = _.keyBy(usersList, '_id');
                    });
            };

            /**
             * @ngdoc method
             * @name sdaFeaturemediaUpdatesTable#updateTable
             * @description Updates the data used to display the table
             */
            const updateTable = () => {
                const report = _.get(scope, 'reportConfigs.charts[0]') || {};
                const items = _.get(report, 'items') || [];
                const operations = getTranslatedOperations();

                const genDateStr = (date) => (
                    moment(date).format(appConfig.view.dateformat + ' ' + appConfig.view.timeformat)
                );

                scope.itemUpdates = [];

                items.forEach((item) => {
                    const updates = (_.get(item, 'updates') || [])
                        .map((update) => ({
                            date: genDateStr(_.get(update, 'operation_created')),
                            user: _.get(scope.users, _.get(update, 'user'), {}).display_name,
                            operation: _.get(operations, _.get(update, 'operation')),
                            update: _.get(update, 'update'),
                            clickable: _.get(update, 'operation') !== 'remove_featuremedia',
                        }));

                    scope.itemUpdates.push({
                        date: genDateStr(_.get(item, 'versioncreated')),
                        creator: _.get(scope.users, _.get(item, 'original_creator'), {}).display_name,
                        slugline: _.get(item, 'slugline'),
                        original: _.get(item, 'original_image'),
                        updates: updates,
                        _id: _.get(item, '_id'),
                    });
                });
            };

            /**
             * @ngdoc method
             * @name sdaFeaturemediaUpdatesTable#onSluglineClicked
             * @param {Object} item - The story item that was clicked
             * @description Loads the item then opens it in the preview
             */
            scope.onSluglineClicked = (item) => {
                searchReport.loadArchiveItem(_.get(item, '_id'))
                    .then((newsItem) => {
                        scope.openPreview(newsItem);
                    }, (error) => {
                        notify.error(error);
                    });
            };

            /**
             * @ngdoc method
             * @name sdaFeaturemediaUpdatesTable#onOriginalClicked
             * @param {Object} item - The image item used on the first publish
             * @description Loads the original image then opens the item in the preview
             */
            scope.onOriginalClicked = (item) => {
                searchReport.loadArchiveItem(_.get(item, 'original._id'))
                    .then((newsItem) => {
                        scope.openPreview(newsItem);
                    }, (error) => {
                        notify.error(error);
                    });
            };

            /**
             * @ngdoc method
             * @name sdaFeaturemediaUpdatesTable#onUpdateClicked
             * @param {Object} item - The story item that this update belongs to
             * @param {Object} update - The history record of the update (from archive_statistics)
             * @description Opens the preview that will load the snapshot renditions and preview them
             */
            scope.onUpdateClicked = (item, update) => {
                if (_.get(update, 'clickable')) {
                    scope.openPreview({
                        item: item,
                        update: update,
                    }, 'renditions-preview');
                }
            };

            init();
        },
    };
}
