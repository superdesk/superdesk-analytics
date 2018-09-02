import {generateSubtitle, formatDate} from '../../utils';

SourceCategoryReportPreview.$inject = ['moment', 'lodash', 'config', 'gettext'];

export function SourceCategoryReportPreview(moment, _, config, gettext) {
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
                _.pickBy(_.get(params, 'must.categories'), (enabled) => !!enabled)
            ).join(', ') || '-';

            scope.sources = Object.keys(
                _.pickBy(_.get(params, 'must.sources'), (enabled) => !!enabled)
            ).join(', ') || '-';

            scope.excluded_states = Object.keys(
                _.pickBy(_.get(params, 'must_not.states'), (enabled) => !!enabled)
            ).join(', ') || '-';

            if (params.date_filter === 'yesterday') {
                scope.dates = gettext('Yesterday');
            } else if (params.date_filter === 'last_week') {
                scope.dates = gettext('Last Week');
            } else if (params.date_filter === 'last_month') {
                scope.dates = gettext('Last Month');
            } else if (params.date_filter === 'range') {
                const startDate = formatDate(moment, config, params.start_date);
                const endDate = formatDate(moment, config, params.end_date);

                scope.dates = gettext('From: ') + startDate + gettext(', To: ') + endDate;
            }
        },
    };
}
