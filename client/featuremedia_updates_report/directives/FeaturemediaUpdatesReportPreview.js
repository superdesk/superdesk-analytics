import {gettext} from 'superdesk-core/scripts/core/utils';

FeaturemediaUpdatesReportPreview.$inject = ['lodash', 'chartConfig'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.featuremedia-updates-report
 * @name PublishingPerformanceReportPreview
 * @requires lodash
 * @requires chartConfig
 * @description Directive to render the preview for Publishing Performance report in Schedules page
 */
export function FeaturemediaUpdatesReportPreview(_, chartConfig) {
    return {
        template: require('../views/featuremedia-updates-report-preview.html'),
        link: function(scope) {
            const params = _.get(scope.report, 'params') || {};

            scope.title = _.get(params, 'chart.title') ?
                params.chart.title :
                gettext('Changes to Featuremedia');

            scope.subtitle = chartConfig.generateSubtitleForDates(params);
        },
    };
}
