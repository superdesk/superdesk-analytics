import {formatDate} from '../../utils';

PreviewDateFilter.$inject = ['moment', 'config'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.search
 * @name sdaPreviewDateFilter
 * @requires moment
 * @requires config
 * @description A directive that renders a date filter preview
 */
export function PreviewDateFilter(moment, config) {
    return {
        template: require('../views/preview-date-filter.html'),
        link: function(scope) {
            const params = _.get(scope, 'report.params') || {};

            scope.dateFilter = _.get(params, 'dates.filter');

            if (scope.dateFilter === 'range') {
                const start = _.get(params, 'dates.start');
                const end = _.get(params, 'dates.end');

                scope.startDate = formatDate(moment, config, start);
                scope.endDate = formatDate(moment, config, end);
            } else if (scope.dateFilter === 'day') {
                const date = _.get(params, 'dates.date');

                scope.date = formatDate(moment, config, date);
            } else if (scope.dateFilter === 'relative') {
                scope.hours = _.get(params, 'dates.relative');
            } else if (scope.dateFilter === 'relative_days') {
                scope.days = _.get(params, 'dates.relative_days');
            }
        },
    };
}
