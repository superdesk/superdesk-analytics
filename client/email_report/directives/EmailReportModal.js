EmailReportModal.$inject = ['emailReport', 'lodash', 'gettext', 'scheduledReports'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.email_report
 * @name sdEmailReportModal
 * @requires emailReport
 * @requires lodash
 * @requires gettext
 * @description A directive that renders a modal to send a report via email
 */
export function EmailReportModal(emailReport, _, gettext, scheduledReports) {
    return {
        template: require('../views/email-report-modal.html'),
        link: function(scope) {
            // TODO: Validate the form, i.e. recipients must not be empty
            //          Create a separate directive for the email form input???

            // TODO: Use the newer tag input from the UI-Framework

            /**
             * @ngdoc method
             * @name init
             * @description Clone the provided report and email parameters
             */
            const init = () => {
                scope.submitting = false;

                scope.report = _.cloneDeep(emailReport.modal.report);
                scope.email = _.cloneDeep(emailReport.modal.email);
                scope.emails = [];

                // This next attribute is required for sd-report-preview-proxy
                // to determine the report type
                scope.report.report = scope.report.type;

                scheduledReports.fetchEmailList()
                    .then((emails) => {
                        scope.emails = emails.map((email) => ({
                            name: email,
                            qcode: email,
                        }));
                    });
            };

            /**
             * @ngdoc method
             * @name sdEmailReportModal#closeModal
             * @description Closes the modal
             */
            scope.closeModal = () => {
                scope.submitting = false;
                scope.report = null;
                scope.email = null;
                emailReport.closeEmailModal();
            };

            /**
             * @ngdoc method
             * @name sdEmailReportModal#sendEmail
             * @description Sends the report and email parameters to the email service
             */
            scope.sendEmail = (emailForm) => {
                emailForm.$setSubmitted();
                scope.validateRecipients(emailForm);

                if (emailForm.$invalid) {
                    return;
                }

                scope.submitting = true;
                const report = _.cloneDeep(scope.report);
                const email = _.cloneDeep(scope.email);

                delete report.report;
                email.html = email.txt;
                emailReport.send(report, email)
                    .then(() => {
                        scope.closeModal();
                    });
            };

            /**
             * @ngdoc property
             * @name sdEmailReportModal#allowedWidths
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
             * @ngdoc property
             * @name sdEmailReportModal#mimeTypes
             * @type {Array<Object>}
             * @description Array of the supported MIME types
             */
            scope.mimeTypes = [
                {type: 'image/jpeg', label: gettext('JPEG Image')},
                {type: 'image/png', label: gettext('PNG Image')},
                {type: 'image/svg+xml', label: gettext('SVG Image')},
                {type: 'text/csv', label: gettext('CSV File')},
                {type: 'application/pdf', label: gettext('PDF File')},
            ];

            /**
             * @ngdoc method
             * @name sdEmailReportModal#validateRecipients
             * @param {Object} emailForm - The DOM form (to set ngModel validitiy)
             * @description Validates the list of recipients and sets the form as valid/invalid accordingly
             */
            scope.validateRecipients = (emailForm) => {
                if (_.get(scope, 'email.recipients.length', 0) < 1) {
                    emailForm.$setValidity('recipients', false);
                } else {
                    emailForm.$setValidity('recipients', true);
                }
            };

            init();
        }
    };
}
