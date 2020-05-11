import {generateTitle} from '../controllers/PublishingPerformanceReportController';

PublishingPerformanceReportPreview.$inject = [
    'lodash',
    'chartConfig',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.publishing-performance-report
 * @name PublishingPerformanceReportPreview
 * @requires lodash
 * @requires chartConfig
 * @description Directive to render the preview for Publishing Performance report in Schedules page
 */
export function PublishingPerformanceReportPreview(_, chartConfig) {
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

                scope.title = generateTitle(chart, params);
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
