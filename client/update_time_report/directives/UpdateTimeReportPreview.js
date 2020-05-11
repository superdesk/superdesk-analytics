import {gettext} from 'superdesk-core/scripts/core/utils';

UpdateTimeReportPreview.$inject = ['lodash', 'chartConfig'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.update-time-report
 * @name sdaUpdateTimeReportPreview
 * @requires lodash
 * @requires chartConfig
 * @description Directive to render the preview for UpdateTime report in Schedules page
 */
export function UpdateTimeReportPreview(_, chartConfig) {
    return {
        template: require('../views/update-time-report-preview.html'),
        link: function(scope) {
            const params = _.get(scope.report, 'params') || {};

            scope.title = _.get(params, 'chart.title') ?
                params.chart.title :
                gettext('Update Time');

            scope.subtitle = chartConfig.generateSubtitleForDates(params);
        },
    };
}
