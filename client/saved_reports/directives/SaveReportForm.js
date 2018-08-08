SaveReportForm.$inject = ['savedReports', 'privileges', '$timeout', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.saved_repotrs
 * @name sdSaveReportForm
 * @requires savedReports
 * @requires privileges
 * @requires lodash
 * @description A directive that renders the save report form
 */
export function SaveReportForm(savedReports, privileges, $timeout, _) {
    return {
        template: require('../views/save-report-form.html'),
        scope: {
            report: '=',
            toggleSaveForm: '=',
            onReportSaved: '=',
            currentTemplate: '=',
        },
        link: function(scope, element, attrs, controller) {
            /**
             * @ngdoc method
             * @name sdSaveReportForm#save
             * @description Creates or updates the current report parameters
             */
            scope.save = () => {
                scope.onReportSaved(
                    savedReports.save(scope.report, scope.currentTemplate)
                );
            };

            /**
             * @ngdoc method
             * @name sdSaveReportForm#saveAs
             * @description Duplicates the currently selected saved report
             */
            scope.saveAs = () => {
                scope.onReportSaved(
                    savedReports.save(scope.report)
                );
            };

            // Focus the name input element
            $timeout(() => {
                element.find('input')
                    .first()
                    .focus();
            }, 0);

            scope.globalPrivilege = _.get(privileges, 'privileges.global_saved_reports') === 1;
        },
    };
}
