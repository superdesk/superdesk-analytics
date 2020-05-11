import {gettext} from 'superdesk-core/scripts/core/utils';

PlanningUsageReportPreview.$inject = ['chartConfig', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.planning-usage-report
 * @name PlanningUsageReportPreview
 * @requires chartConfig
 * @requires lodash
 * @description Directive to render the preview for PlanningUsage report in Schedules page
 */
export function PlanningUsageReportPreview(chartConfig, _) {
    return {
        template: require('../views/planning-usage-report-preview.html'),
        link: function(scope) {
            const params = _.get(scope.report, 'params') || {};

            scope.title = _.get(params, 'chart.title') ?
                params.chart.title :
                gettext('Planning Module Usage');

            scope.subtitle = chartConfig.generateSubtitleForDates(
                _.get(scope.report, 'params') || {}
            );
        },
    };
}