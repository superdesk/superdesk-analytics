SaveGenerateReport.$inject = ['lodash', 'privileges', 'savedReports'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.saved_reports
 * @name sdSaveGenerateReport
 * @requires lodash
 * @requires privileges
 * @description A directive that renders the form generate/clear/save button controls
 */
export function SaveGenerateReport(_, privileges, savedReports) {
    return {
        template: require('../views/save-generate-report.html'),
        replace: true,
        scope: {
            generateReport: '=',
            getReportParams: '=',
            isDirty: '=',
            _viewSchedule: '=viewSchedule',
            onClearFilters: '=',
        },
        link: function(scope, element, attrs, controller) {
            scope.showSaveForm = false;
            scope.currentParams = {};
            scope.currentTemplate = {};

            scope.canSave = _.get(privileges, 'privileges.saved_reports') === 1 ||
                _.get(privileges, 'privileges.global_saved_reports') === 1;

            scope.$watch(() => savedReports.currentReport, () => {
                scope.currentTemplate = savedReports.currentReport;
            });

            /**
             * @ngdoc method
             * @name sdSaveGenerateReport#toggleSaveForm
             * @description Toggles the save report form
             */
            scope.toggleSaveForm = () => {
                const showSaveForm = !scope.showSaveForm;

                // If we're opening the form, then request the current params
                // and translations from the current report controller
                if (showSaveForm) {
                    scope.getReportParams()
                    .then((params) => {
                        scope.currentParams = Object.assign(
                            {},
                            params,
                            {
                                name: scope.currentTemplate.name,
                                description: scope.currentTemplate.description,
                            }
                        );
                        scope.showSaveForm = showSaveForm;
                    });
                } else {
                    scope.showSaveForm = showSaveForm;
                    scope.currentParams = {};
                }
            };

            /**
             * @ngdoc method
             * @name sdSaveGenerateReport#viewSchedule
             * @description Views schedules for the current saved report
             */
            scope.viewSchedule = () => (
                scope._viewSchedule(scope.currentTemplate)
            );

            scope.clearFilters = () => {
                savedReports.selectReport({});

                if (scope.onClearFilters) {
                    scope.onClearFilters();
                }
            };
        },
    };
}
