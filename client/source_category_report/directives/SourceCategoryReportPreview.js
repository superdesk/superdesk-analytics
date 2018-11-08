SourceCategoryReportPreview.$inject = ['moment', 'lodash', 'config', 'gettext', 'chartConfig'];

export function SourceCategoryReportPreview(moment, _, config, gettext, chartConfig) {
    return {
        template: require('../views/source-category-report-preview.html'),
        link: function(scope, element) {
            const params = _.get(scope.report, 'params') || {};

            scope.subtitle = chartConfig.generateSubtitleForDates(params);

            scope.categories = Object.keys(
                _.pickBy(_.get(params, 'must.categories'), (enabled) => !!enabled)
            ).join(', ') || '-';

            scope.sources = Object.keys(
                _.pickBy(_.get(params, 'must.sources'), (enabled) => !!enabled)
            ).join(', ') || '-';

            scope.excluded_states = Object.keys(
                _.pickBy(_.get(params, 'must_not.states'), (enabled) => !!enabled)
            ).join(', ') || '-';
        },
    };
}
