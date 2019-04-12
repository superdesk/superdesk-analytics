import {formatDate} from '../../utils';
import {DATE_FILTERS} from '../common';

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

            if (scope.dateFilter === DATE_FILTERS.RANGE) {
                const start = _.get(params, 'dates.start');
                const end = _.get(params, 'dates.end');

                scope.startDate = formatDate(moment, config, start);
                scope.endDate = formatDate(moment, config, end);
            } else if (scope.dateFilter === DATE_FILTERS.DAY) {
                const date = _.get(params, 'dates.date');

                scope.date = formatDate(moment, config, date);
            } else if (scope.dateFilter === DATE_FILTERS.RELATIVE_HOURS) {
                scope.hours = _.get(params, 'dates.relative');
            } else if (scope.dateFilter === DATE_FILTERS.RELATIVE_DAYS) {
                scope.days = _.get(params, 'dates.relative');
            } else if (scope.dateFilter === DATE_FILTERS.RELATIVE_WEEKS) {
                scope.weeks = _.get(params, 'dates.relative');
            } else if (scope.dateFilter === DATE_FILTERS.RELATIVE_MONTHS) {
                scope.months = _.get(params, 'dates.relative');
            }
        },
    };
}
