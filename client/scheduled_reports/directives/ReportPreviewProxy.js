ReportPreviewProxy.$inject = ['$compile', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.scheduled_reports
 * @name sdaReportPreviewProxy
 * @requires $compile
 * @requires lodash
 * @description A directive that compiles and renders a preview directive based on the
 * provided report in the scope
 */
export function ReportPreviewProxy($compile, _) {
    return {
        scope: {
            report: '=',
        },
        link: function(scope, element) {
            /**
             * @ngdoc method
             * @name sdaReportPreviewProxy#constructTemplate
             * @description Creates and compiles the angular preview directive
             * for the provided report
             */
            const constructTemplate = () => {
                const reportType = _.get(scope.report, 'report');

                if (reportType) {
                    const directive = `sda-${reportType.replace(/_/g, '-')}-preview`;
                    const template = `<div ${directive}></div>`;

                    element.replaceWith($compile(template)(scope));
                }
            };

            scope.$watch('report', constructTemplate);
            constructTemplate();
        },
    };
}
