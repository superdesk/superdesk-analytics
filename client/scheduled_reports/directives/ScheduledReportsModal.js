import {getErrorMessage} from '../../utils';

ScheduledReportsModal.$inject = ['lodash', 'savedReports', 'scheduledReports', 'notify', 'gettext'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.scheduled_reports
 * @name sdScheduledReportsModal
 * @requires lodash
 * @requires savedReports
 * @requires scheduledReports
 * @requires notify
 * @requires gettext
 * @description A directive that renders the editor popup modal
 */
export function ScheduledReportsModal(_, savedReports, scheduledReports, notify, gettext) {
    return {
        template: require('../views/scheduled-reports-modal.html'),
        link: function(scope) {
            this.init = () => {
                scope.currentSavedReport = {};
                scope.schedule = _.cloneDeep(scope.currentSchedule);
                scope.savedReports = [];
                scope.submitting = false;
                scope.emails = [];

                this.fetchSavedReports();
                scheduledReports.fetchEmailList()
                    .then((emails) => {
                        scope.emails = emails.map((email) => ({
                            name: email,
                            qcode: email,
                        }));
                    });
            };

            /**
             * @ngdoc property
             * @name sdScheduledReportsModal#allowedWidths
             * @type {Array<Number>}
             * @description Provides array of allowed widths for use with width dropdown
             */
            scope.allowedWidths = [
                400,
                600,
                800,
                1000,
                1200,
                1400
            ];

            /**
             * @ngdoc method
             * @name sdScheduledReportsModal#fetchSavedReports
             * @description Fetches the saved reports for use with the current schedule
             */
            this.fetchSavedReports = () => {
                savedReports.fetchAll(scope.schedule.report_type)
                    .then((reports) => {
                        scope.savedReports = _.concat(
                            reports.global,
                            _.filter(reports.user, (report) => report.is_global)
                        );

                        scope.setSavedReport();
                    });
            };

            /**
             * @ngdoc method
             * @name sdScheduledReportsModal#setSavedReport
             * @description Sets the saved report object for use with showing report parameters
             */
            scope.setSavedReport = () => {
                scope.currentSavedReport = _.find(
                    scope.savedReports,
                    (report) => report._id === scope.schedule.saved_report
                ) || {};
            };

            /**
             * @ngdoc method
             * @name sdScheduledReportsModal#save
             * @param {Object} scheduleForm - The DOM form (to set ngModel/ngForm attributes)
             * @param {Object} schedule - The current schedule to save
             * @description Saves the current schedule, and closes the modal on success
             * If the form is not valid, then does not do anything except sets the form as submitted
             */
            scope.save = (scheduleForm, schedule) => {
                scheduleForm.$setSubmitted();
                scope.validateRecipients(scheduleForm);

                if (scheduleForm.$invalid) {
                    return;
                }

                scope.submitting = true;
                const newSchedule = !_.get(scope, 'currentSchedule._id');

                scheduledReports.save(schedule, scope.currentSchedule)
                    .then(() => {
                        scope.submitting = false;
                        notify.success(newSchedule ?
                            gettext('Report Schedule created!') :
                            gettext('Report Schedule saved!')
                        );

                        scope.closeModal();
                    }, (error) => {
                        scope.submitting = false;
                        notify.error(getErrorMessage(error, newSchedule ?
                            gettext('Failed to create the Report Schedule!') :
                            gettext('Failed to save the Report Schedule!')
                        ));
                    });
            };

            /**
             * @ngdoc method
             * @name sdScheduledReportsModal#validateRecipients
             * @param {Object} scheduleForm - The DOM form (to set ngModel validity)
             * @description Validates the list of recipients and sets the form as valid/invalid accordingly
             */
            scope.validateRecipients = (scheduleForm) => {
                if (_.get(scope.schedule, 'recipients.length', 0) < 1) {
                    scheduleForm.$setValidity('recipients', false);
                } else {
                    scheduleForm.$setValidity('recipients', true);
                }
            };

            this.init();
        },
    };
}
