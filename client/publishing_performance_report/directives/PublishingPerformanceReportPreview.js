import {generateTitle} from '../controllers/PublishingPerformanceReportController';

PublishingPerformanceReportPreview.$inject = [
    'lodash',
    'gettextCatalog',
    'chartConfig',
    '$interpolate',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.publishing-performance-report
 * @name PublishingPerformanceReportPreview
 * @requires lodash
 * @requires gettextCatalog
 * @requires chartConfig
 * @requires $interpolate
 * @description Directive to render the preview for Publishing Performance report in Schedules page
 */
export function PublishingPerformanceReportPreview(
    _,
    gettextCatalog,
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

                scope.title = generateTitle(
                    $interpolate,
                    gettextCatalog,
                    chart,
                    params
                );
                scope.subtitle = chartConfig.generateSubtitleForDates(params);

                chartConfig.loadTranslations([
                    _.get(params, 'aggs.group.field'),
                    _.get(params, 'aggs.subgroup.field'),
                ])
                    .then(() => {
                        scope.group = chart.getSourceName(_.get(params, 'aggs.group.field'));
                        scope.subgroup = chart.getSourceName(
                            _.get(params, 'aggs.subgroup.field')
                        ) || '-';
                    });
            };

            init();
        },
    };
}
