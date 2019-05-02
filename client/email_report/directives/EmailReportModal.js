EmailReportModal.$inject = ['emailReport', 'lodash', 'gettext'];

/**
 * @ngdoc directive
 * @module superdesk.analytics.email_report
 * @name sdEmailReportModal
 * @requires emailReport
 * @requires lodash
 * @requires gettext
 * @description A directive that renders a modal to send a report via email
 */
export function EmailReportModal(emailReport, _, gettext) {
    return {
        template: require('../views/email-report-modal.html'),
        link: function(scope) {
            /**
             * @ngdoc method
             * @name init
             * @description Clone the provided report and email parameters
             */
            const init = () => {
                scope.submitting = false;

                scope.report = _.cloneDeep(emailReport.modal.report);
                scope.email = _.cloneDeep(emailReport.modal.email);

                // This next attribute is required for sda-report-preview-proxy
                // to determine the report type
                scope.report.report = scope.report.type;
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
                1400,
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
                // {type: 'image/svg+xml', label: gettext('SVG Image')},
                // {type: 'text/csv', label: gettext('CSV File')},
                {type: 'application/pdf', label: gettext('PDF File')},
            ];

            init();
        },
    };
}
