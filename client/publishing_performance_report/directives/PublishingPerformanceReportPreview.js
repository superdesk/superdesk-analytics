import {formatDate, generateSubtitle} from '../../utils';
import {generateTitle} from '../controllers/PublishingPerformanceReportController';

PublishingPerformanceReportPreview.$inject = [
    'lodash',
    'moment',
    'config',
    'gettext',
    'gettextCatalog',
    '$q',
    'userList',
    'desks',
    'metadata',
    'chartConfig',
    '$interpolate',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.publishing-performance-report
 * @name PublishingPerformanceReportPreview
 * @requires lodash
 * @requires moment
 * @requires config
 * @requires gettext
 * @requires gettextCatalog
 * @requires $q
 * @requires userList
 * @requires desks
 * @requires metadata
 * @requires chartConfig
 * @requires $interpolate
 * @description Directive to render the preview for Publishing Performance report in Schedules page
 */
export function PublishingPerformanceReportPreview(
    _,
    moment,
    config,
    gettext,
    gettextCatalog,
    $q,
    userList,
    desks,
    metadata,
    chartConfig,
    $interpolate
) {
    return {
        template: require('../views/publishing-performance-report-preview.html'),
        link: function(scope) {
            const params = _.get(scope.report, 'params') || {};
            const chart = chartConfig.newConfig('chart', _.get(params, 'chart.type'));

            const init = () => {
                scope.title = '-';
                scope.subtitle = '-';
                scope.group = '-';
                scope.subgroup = '-';

                scope.dates = '-';
                scope.source = '-';
                scope.urgency = '-';
                scope.excluded_states = '-';

                scope.desks = '-';
                scope.users = '-';
                scope.categories = '-';
                scope.genre = '-';

                loadTitles();
                loadDateString();
                loadCVStrings();
            };

            const loadTitles = () => {
                scope.title = generateTitle(
                    $interpolate,
                    gettextCatalog,
                    chart,
                    params
                );
                scope.subtitle = generateSubtitle(
                    moment,
                    config,
                    params
                );

                scope.group = chart.getSourceName(_.get(params, 'aggs.group.field'));
                scope.subgroup = chart.getSourceName(
                    _.get(params, 'aggs.subgroup.field')
                ) || '-';
            };

            const convertIdsToString = (source, ids, idField, nameField) => (
                source.filter((item) => (
                    ids.indexOf(_.get(item, idField)) > -1
                ))
                    .map((item) => _.get(item, nameField))
                    .join(', ') || '-'
            );

            const loadDateString = () => {
                const dateFilter = _.get(params, 'dates.filter');
                const start = _.get(params, 'dates.start');
                const end = _.get(params, 'dates.end');

                if (dateFilter === 'yesterday') {
                    scope.dates = gettext('Yesterday');
                } else if (dateFilter === 'last_week') {
                    scope.dates = gettext('Last Week');
                } else if (dateFilter === 'last_month') {
                    scope.dates = gettext('Last Month');
                } else if (dateFilter === 'range') {
                    const startDate = formatDate(moment, config, start);
                    const endDate = formatDate(moment, config, end);

                    scope.dates = gettext('From: ') + startDate + gettext(', To: ') + endDate;
                }
            };

            const loadCVStrings = () => {
                scope.source = (_.get(params, 'must.sources') || []).join(', ') || '-';
                scope.urgency = (_.get(params, 'must.urgency') || []).join(', ') || '-';

                scope.excluded_states = Object.keys(
                    _.pickBy(_.get(params, 'must_not.states'), (enabled) => !!enabled)
                ).join(', ') || '-';

                $q.all({
                    metadata: metadata.initialize(),
                    desks: desks.fetchDesks(),
                    users: userList.getAll(),
                })
                    .then((data) => {
                        scope.desks = convertIdsToString(
                            _.get(data, 'desks._items') || [],
                            _.get(params, 'must.desks') || [],
                            '_id',
                            'name'
                        );

                        scope.users = convertIdsToString(
                            _.get(data, 'users') || [],
                            _.get(params, 'must.users') || [],
                            '_id',
                            'display_name'
                        );

                        scope.categories = convertIdsToString(
                            _.get(metadata, 'values.categories') || [],
                            _.get(params, 'must.categories') || [],
                            'qcode',
                            'name'
                        );

                        scope.genre = convertIdsToString(
                            _.get(metadata, 'values.genre') || [],
                            _.get(params, 'must.genre') || [],
                            'qcode',
                            'name'
                        );
                    });
            };

            init();
        }
    };
}
