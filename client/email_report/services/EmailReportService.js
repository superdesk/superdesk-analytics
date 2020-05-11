import {gettext} from 'superdesk-core/scripts/core/utils';

import {getErrorMessage} from '../../utils';

EmailReportService.$inject = ['api', 'notify', 'savedReports', 'lodash'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.email_report
 * @name emailReport
 * @requires api
 * @requires notify
 * @requires savedReports
 * @requires lodash
 * @description Service to send email(s) containing report chart(s)
 */
export function EmailReportService(api, notify, savedReports, _) {
    /**
     * @ngdoc method
     * @name init
     * @description Initialise default attributes for the model
     */
    const init = () => {
        this.modal = {
            report: null,
            email: null,
            open: false,
        };
    };

    /**
     * @ngdoc method
     * @name emailReport#openEmailModal
     * @param {Object} report - Object containing the report parameters
     * @param {Object} email - Object containing the email parameters
     * @description Sets the report/email parameters and opens the Email modal
     */
    this.openEmailModal = (report, email) => {
        this.modal.report = _.cloneDeep(report);
        this.modal.email = _.cloneDeep(email);
        this.modal.open = true;
    };

    /**
     * @ngdoc method
     * @name emailReport#closeEmailModal
     * @description Clears the report/email parameters and closes the Email modal
     */
    this.closeEmailModal = () => {
        this.modal.report = null;
        this.modal.email = null;
        this.modal.open = false;
    };

    /**
     * @ngdoc method
     * @name emailReport#send
     * @param {Object} report - Report type, parameters and chart attributes
     * @param {Object} email - Email recipients, subject and body
     * @description Sends the report/email parameters to the endpoint for processing
     */
    this.send = (report, email) => (
        api('email_report').save({}, {
            report: savedReports.convertDatesForServer(report),
            email: email,
        })
            .then(() => {
                notify.success(gettext('Report chart emailed!'));
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to send report email!'))
                );
            })
    );

    init();
}
