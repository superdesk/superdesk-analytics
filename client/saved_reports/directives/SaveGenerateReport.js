SaveGenerateReport.$inject = ['lodash', 'privileges'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.saved_reports
 * @name sdSaveGenerateReport
 * @requires lodash
 * @requires privileges
 * @description A directive that renders the form generate/clear/save button controls
 */
export function SaveGenerateReport(_, privileges) {
    return {
        template: require('../views/save-generate-report.html'),
        replace: true,
        scope: {
            clearFilters: '=',
            generateReport: '=',
            currentParams: '=',
            isDirty: '=',
            currentTemplate: '=',
            _onReportSaved: '=onReportSaved',
            _viewSchedule: '=viewSchedule'
        },
        link: function(scope, element, attrs, controller) {
            scope.showSaveForm = false;
            scope.canSave = _.get(privileges, 'privileges.saved_reports') === 1 ||
                _.get(privileges, 'privileges.global_saved_reports') === 1;

            /**
             * @ngdoc method
             * @name sdSaveGenerateReport#toggleSaveForm
             * @description Toggles the save report form
             */
            scope.toggleSaveForm = () => {
                scope.showSaveForm = !scope.showSaveForm;
            };

            /**
             * @ngdoc method
             * @name sdSaveGenerateReport#onReportSaved
             * @param {Promise<object>} response - Promise with the API save response
             * @return {Promise}
             * @description Toggles the save report form if the save is successful
             */
            scope.onReportSaved = (response) => (
                scope._onReportSaved(
                    response.then((savedReport) => {
                        scope.toggleSaveForm();
                        return savedReport;
                    })
                )
            );

            /**
             * @ngdoc method
             * @name sdSaveGenerateReport#viewSchedule
             * @description Views schedules for the current saved report
             */
            scope.viewSchedule = () => (
                scope._viewSchedule(scope.currentTemplate)
            );
        },
    };
}
