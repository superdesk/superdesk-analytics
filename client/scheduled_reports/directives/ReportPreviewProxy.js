ReportPreviewProxy.$inject = ['$compile'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.scheduled_reports
 * @name sdReportPreviewProxy
 * @requires $compile
 * @description A directive that compiles and renders a preview directive based on the
 * provided report in the scope
 */
export function ReportPreviewProxy($compile) {
    return {
        scope: {
            report: '=',
        },
        link: function(scope, element) {
            /**
             * @ngdoc method
             * @name sdReportPreviewProxy#constructTemplate
             * @description Creates and compiles the angular preview directive
             * for the provided report
             */
            const constructTemplate = () => {
                const template = `<div sd-${scope.report.report.replace(/_/g, '-')}-preview ></div>`;

                element.replaceWith($compile(template)(scope));
            };

            scope.$watch('report', constructTemplate);
            constructTemplate();
        },
    };
}
