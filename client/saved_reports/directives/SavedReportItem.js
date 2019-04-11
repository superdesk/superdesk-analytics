SavedReportItem.$inject = ['lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.saved_report
 * @name sdSavedReportItem
 * @requires lodash
 * @description A directive that renders a saved report item for use in the list of saved reports
 */
export function SavedReportItem(_) {
    return {
        template: require('../views/saved-report-item.html'),
        replace: true,
        scope: {
            report: '=',
            removeReport: '=',
            selectReport: '=',
            currentReport: '=',
            currentUser: '=',
            ownerName: '=',
            globalPrivilege: '=',
            localPrivilege: '=',
            schedulePrivilege: '=',
            isSelected: '=',
            _createNewSchedule: '=createNewSchedule',
            _viewSchedules: '=viewSchedules',
        },
        link: function(scope) {
            scope.selected = false;

            /**
             * @ngdoc method
             * @name sdSavedReportItem#remove
             * @param {MouseEvent} event
             * @description Initiates a remove action for this saved report
             */
            scope.remove = (event) => {
                // Highlight the item
                scope.selected = true;

                scope.preventClick(event);

                scope.removeReport(scope.report)
                    .finally(() => {
                        // If the user clicks 'CANCEL', then deselect this item
                        scope.selected = false;
                    });
            };

            /**
             * @ngdoc method
             * @name sdSavedReportItem#preventClick
             * @param {MouseEvent} event
             * @description Prevents default functionality on click (i.e. don't propagate)
             */
            scope.preventClick = (event) => {
                // Make sure that the select function is not called
                event.preventDefault();
                event.stopPropagation();
            };

            /**
             * @ngdoc method
             * @name sdSavedReportItem#select
             * @description Selects the current report
             */
            scope.select = () => {
                scope.selectReport(scope.report);
            };

            /**
             * @ngdoc method
             * @name sdSavedReportItem#isReportSelected
             * @return {boolean}
             * @description Returns true or false depending on if this report is selected or not
             */
            scope.isReportSelected = () => (
                scope.isSelected || scope.selected
            );

            /**
             * @ngdoc method
             * @name sdSavedReportItem#forCurrentUser
             * @return {boolean}
             * @description Returns true if this report is owned by the current user, false otherwise
             */
            scope.forCurrentUser = () => (
                scope.currentUser === _.get(scope, 'report.user')
            );

            /**
             * @ngdoc method
             * @name sdSavedReportItem#createNewSchedule
             * @description Opens the create new schedule modal for this saved report
             */
            scope.createNewSchedule = () => (
                scope._createNewSchedule(scope.report)
            );

            /**
             * @ngdoc method
             * @name sdSavedReportItem#viewSchedules
             * @description Views the schedules for this saved report
             */
            scope.viewSchedules = () => (
                scope._viewSchedules(scope.report)
            );
        },
    };
}
