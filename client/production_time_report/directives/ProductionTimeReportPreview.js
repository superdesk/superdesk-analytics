ProductionTimeReportPreview.$inject = ['chartConfig', 'gettext', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.production-time-report
 * @name ProductionTimeReportPreviewReportPreview
 * @requires chartConfig
 * @requires gettext
 * @requires lodash
 * @description Directive to render the preview for ProductionTime report in Schedules page
 */
export function ProductionTimeReportPreview(chartConfig, gettext, _) {
    return {
        template: require('../views/production-time-report-preview.html'),
        link: function(scope) {
            const params = _.get(scope.report, 'params') || {};

            scope.title = _.get(params, 'chart.title') ?
                params.chart.title :
                gettext('Planning Module Usage');

            scope.subtitle = chartConfig.generateSubtitleForDates(
                _.get(scope.report, 'params') || {}
            );

            const names = {
                min: gettext('Minimum'),
                sum: gettext('Sum'),
                avg: gettext('Average'),
                max: gettext('Maximum'),
            };

            scope.statNames = Object.keys(_.get(params, 'stats') || {})
                .filter((stat) => _.get(params.stats, stat))
                .map((stat) => _.get(names, stat) || '')
                .join(', ');
        },
    };
}
