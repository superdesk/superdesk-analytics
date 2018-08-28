import {generateSubtitle, formatDate} from '../../utils';

SourceCategoryReportPreview.$inject = ['moment', 'lodash', 'config'];

export function SourceCategoryReportPreview(moment, _, config) {
    return {
        template: require('../views/source-category-report-preview.html'),
        link: function(scope, element) {
            const params = _.get(scope.report, 'params') || {};

            scope.subtitle = generateSubtitle(
                moment,
                config,
                params
            );

            scope.categories = Object.keys(
                _.pickBy(params.categories, (enabled) => !!enabled)
            ).join(', ') || '-';

            scope.sources = Object.keys(
                _.pickBy(params.sources, (enabled) => !!enabled)
            ).join(', ') || '-';

            scope.excluded_states = Object.keys(
                _.pickBy(params.excluded_states, (enabled) => !!enabled)
            ).join(', ') || '-';

            if (params.date_filter === 'yesterday') {
                scope.dates = 'Yesterday';
            } else if (params.date_filter === 'last_week') {
                scope.dates = 'Last Week';
            } else if (params.date_filter === 'last_month') {
                scope.dates = 'Last Month';
            } else if (params.date_filter === 'range') {
                const startDate = formatDate(moment, config, params.start_date);
                const endDate = formatDate(moment, config, params.end_date);

                scope.dates = `From: ${startDate}, To: ${endDate}`;
            }
        },
    };
}
