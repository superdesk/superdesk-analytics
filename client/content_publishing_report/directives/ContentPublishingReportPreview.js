import {formatDate} from '../../utils';

ContentPublishingReportPreview.$inject = [
    'lodash',
    'moment',
    'config',
    'gettext',
    'contentPublishingReports',
    '$q',
    'userList',
    'desks',
    'metadata',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-publishing-report
 * @name ContentPublishingReportPreview
 * @requires lodash
 * @requires moment
 * @requires config
 * @requires gettext
 * @requires contentPublishingReports
 * @requires $q
 * @requires userList
 * @requires desks
 * @requires metadata
 * @description Directive to render the preview for ContentPublishing report in Schedules page
 */
export function ContentPublishingReportPreview(
    _,
    moment,
    config,
    gettext,
    contentPublishingReports,
    $q,
    userList,
    desks,
    metadata
) {
    return {
        template: require('../views/content-publishing-report-preview.html'),
        link: function(scope) {
            const params = _.get(scope.report, 'params') || {};

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
                scope.title = contentPublishingReports.generateTitle(params);
                scope.subtitle = contentPublishingReports.generateSubtitle(params);

                scope.group = contentPublishingReports.getFieldTitle(_.get(params, 'aggs.group.field'));
                scope.subgroup = contentPublishingReports.getFieldTitle(
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
