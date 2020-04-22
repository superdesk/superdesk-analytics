import {appConfig} from 'appConfig';

UpdateTimeTable.$inject = [
    'gettext',
    'userList',
    'moment',
    'api',
    'lodash',
    '$interpolate',
    '$q',
    'notify',
    '$rootScope',
    'searchReport',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.update-time-report
 * @name sdaUpdateTimeTable
 * @requires gettext
 * @requires userList
 * @requires moment
 * @requires api
 * @requires lodash
 * @requires $interpolate
 * @requires $q
 * @requires notify
 * @requires $rootScope
 * @requires searchReport
 * @description Directive to render the interactive featuremedia updates table
 */
export function UpdateTimeTable(
    gettext,
    userList,
    moment,
    api,
    _,
    $interpolate,
    $q,
    notify,
    $rootScope,
    searchReport
) {
    return {
        replace: true,
        require: '^sdaAnalyticsContainer',
        template: require('../views/update-time-table.html'),
        link: function(scope, element) {
            /**
             * @ngdoc method
             * @name sdaUpdateTimeTable#init
             * @description Initialises the scope parameters and loads list of users
             */
            const init = () => {
                scope.selected = {preview: null};
                scope.itemUpdates = [];
                scope.page = {
                    no: 1,
                    size: 5,
                    max: 5,
                    sort: {
                        field: 'time_to_next_update_publish',
                        order: 'desc',
                    },
                };

                scope.headers = [
                    {title: gettext('Published'), field: 'firstpublished'},
                    {title: gettext('Slugline')},
                    {title: gettext('Headline')},
                    {title: gettext('Updated In'), field: 'time_to_next_update_publish'},
                ];
            };

            /**
             * @ngdoc method
             * @name sdaUpdateTimeTable#updateTable
             * @description Updates the data used to display the table
             */
            const updateTable = () => {
                const report = _.get(scope, 'reportConfigs.charts[0]') || {};
                const items = _.get(report, '_items') || [];

                const meta = _.get(report, '_meta') || {};

                scope.page.no = meta.page || 1;
                scope.page.size = report.size;
                scope.page.max = Math.ceil(meta.total / report.size);

                const genDateStr = (date) => (
                    moment(date).format(appConfig.view.dateformat + ' ' + appConfig.view.timeformat)
                );

                const getUpdateString = (seconds) => {
                    const times = moment()
                        .startOf('day')
                        .seconds(seconds)
                        .format('H:m:s')
                        .split(':');

                    if (times[0] > 0) {
                        return $interpolate(
                            gettext('{{hours}} hours, {{minutes}} minutes')
                        )({hours: times[0], minutes: times[1]});
                    }

                    return $interpolate(
                        gettext('{{minutes}} minutes')
                    )({minutes: times[1]});
                };

                scope.rows = [];

                items.forEach((item) => {
                    const publishTime = _.get(item, 'firstpublished');
                    const updateTime = moment(publishTime)
                        .add(_.get(item, 'time_to_next_update_publish'), 'seconds');
                    const updated = getUpdateString(_.get(item, 'time_to_next_update_publish')) +
                        ` (${genDateStr(updateTime)})`;

                    scope.rows.push([{
                        label: genDateStr(publishTime),
                        clickable: true,
                        tooltip: gettext('View Original'),
                        id: _.get(item, '_id'),
                    }, {
                        label: _.get(item, 'slugline'),
                        clickable: false,
                    }, {
                        label: _.get(item, 'headline'),
                        clickable: false,
                    }, {
                        label: updated,
                        clickable: true,
                        tooltip: gettext('View Update'),
                        id: _.get(item, 'rewritten_by'),
                    }]);
                });
            };

            /**
             * @ngdoc method
             * @name sdaUpdateTimeTable#onCellClicked
             * @param {Object} data - The data from the cell that was clicked
             * @description Loads the item then opens it in the preview
             */
            scope.onCellClicked = (data) => {
                searchReport.loadArchiveItem(_.get(data, 'id'))
                    .then((newsItem) => {
                        scope.openPreview(newsItem);
                    }, (error) => {
                        notify.error(error);
                    });
            };

            // Scroll to the top when the report configs change
            scope.$watch('reportConfigs.charts', () => {
                element.parent().scrollTop(0);
                scope.closePreview();
                updateTable();
            }, true);

            scope.$watch('page', (newPage, oldPage) => {
                const newParams = {};

                if (newPage.no !== oldPage.no) {
                    newParams.page = newPage.no;
                }

                if (newPage.sort.field !== oldPage.sort.field || newPage.sort.order !== oldPage.sort.order) {
                    newParams.sort = [{[newPage.sort.field]: newPage.sort.order}];
                }

                if (Object.keys(newParams).length > 0) {
                    $rootScope.$broadcast('analytics:update-params', newParams);
                }
            }, true);

            init();
        },
    };
}
