import {formatDate} from '../../utils';
import {DATE_FILTERS} from '../common';

PreviewDateFilter.$inject = ['moment'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.search
 * @name sdaPreviewDateFilter
 * @requires moment
 * @description A directive that renders a date filter preview
 */
export function PreviewDateFilter(moment) {
    return {
        template: require('../views/preview-date-filter.html'),
        link: function(scope) {
            const params = _.get(scope, 'report.params') || {};

            scope.dateFilter = _.get(params, 'dates.filter');

            if (scope.dateFilter === DATE_FILTERS.RANGE) {
                const start = _.get(params, 'dates.start');
                const end = _.get(params, 'dates.end');

                scope.startDate = formatDate(start);
                scope.endDate = formatDate(end);
            } else if (scope.dateFilter === DATE_FILTERS.DAY) {
                const date = _.get(params, 'dates.date');

                scope.date = formatDate(date);
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
