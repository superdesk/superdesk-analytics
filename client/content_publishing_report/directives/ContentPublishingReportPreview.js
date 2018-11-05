import {generateTitle} from '../controllers/ContentPublishingReportController';

ContentPublishingReportPreview.$inject = [
    'lodash',
    'gettextCatalog',
    '$interpolate',
    'chartConfig',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-publishing-report
 * @name ContentPublishingReportPreview
 * @requires lodash
 * @requires gettextCatalog
 * @requires $interpolate
 * @requires chartConfig
 * @description Directive to render the preview for ContentPublishing report in Schedules page
 */
export function ContentPublishingReportPreview(
    _,
    gettextCatalog,
    $interpolate,
    chartConfig
) {
    return {
        template: require('../views/content-publishing-report-preview.html'),
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
                    _.get(params, 'aggs.subgroup.field')
                ])
                    .then(() => {
                        scope.group = chart.getSourceName(_.get(params, 'aggs.group.field'));
                        scope.subgroup = chart.getSourceName(
                            _.get(params, 'aggs.subgroup.field')
                        ) || '-';
                    });
            };

            init();
        }
    };
}
