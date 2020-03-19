import {appConfig} from 'superdesk-core/scripts/appConfig';

import {getErrorMessage} from '../../utils';

SavedReportsService.$inject = [
    'lodash',
    'api',
    'session',
    'moment',
    '$location',
    'notify',
    'gettext',
    '$rootScope',
];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name savedReports
 * @requires lodash
 * @requires api
 * @requires session
 * @description Service to create, read, update and delete saved reports
 */
export function SavedReportsService(
    _,
    api,
    session,
    moment,
    $location,
    notify,
    gettext,
    $rootScope
) {
    const init = () => {
        this.currentReport = {};
        $rootScope.$on('savedreports:update', angular.bind(this, this.onReportUpdated));
    };

    /**
     * @ngdoc method
     * @name savedReports#convertDatesForServer
     * @param {Object} params - Report parameters
     * @return {Object}
     * @description Returns a cloned parameters with dates converted for the server
     */
    this.convertDatesForServer = (params) => {
        const report = _.cloneDeep(params);

        if (_.get(report, 'params.dates.start')) {
            report.params.dates.start = moment(report.params.dates.start, appConfig.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'params.dates.end')) {
            report.params.dates.end = moment(report.params.dates.end, appConfig.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'params.dates.date')) {
            report.params.dates.date = moment(report.params.dates.date, appConfig.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'params.dates.filter') && report.params.dates.filter !== 'range') {
            delete report.params.dates.start;
            delete report.params.dates.end;
        }

        return report;
    };

    /**
     * @ngdoc method
     * @name savedReports#convertDatesForClient
     * @param {Object} params - Report parameters
     * @return {Object}
     * @description Returns a cloned parameters with dates converted for the client
     */
    this.convertDatesForClient = (params) => {
        const report = _.cloneDeep(params);

        if (_.get(report, 'params.dates.start')) {
            report.params.dates.start = moment(report.params.dates.start, 'YYYY-MM-DD')
                .format(appConfig.model.dateformat);
        }

        if (_.get(report, 'params.dates.end')) {
            report.params.dates.end = moment(report.params.dates.end, 'YYYY-MM-DD')
                .format(appConfig.model.dateformat);
        }

        if (_.get(report, 'params.dates.date')) {
            report.params.dates.date = moment(report.params.dates.date, 'YYYY-MM-DD')
                .format(appConfig.model.dateformat);
        }

        return report;
    };

    /**
     * @ngdoc method
     * @name savedReports#fetchById
     * @param {String} reportId - The ID of the saved report
     * @return {Promise<Object>} - The report (if found)
     * @description Fetch a report by its ID from the server
     */
    this.fetchById = (reportId) => (
        api('saved_reports').getById(reportId)
            .then((report) => this.convertDatesForClient(report))
    );

    /**
     * @ngdoc method
     * @name savedReports#fetchAll
     * @param {String} reportType - The report type to load
     * @param {Number} page - The page number to load
     * @return {Promise<Object>} - User/Global report arrays
     * @description Fetch the User and Global reports for the provided report type
     */
    this.fetchAll = (reportType, page = 1) => (
        api('saved_reports').query({
            max_results: 200,
            page: page,
            where: JSON.stringify({report: reportType}),
        })
            .then((result) => ({
                user: _.map(
                    _.filter(result._items, (report) => report.user === session.identity._id),
                    (report) => this.convertDatesForClient(report)
                ),
                global: _.map(
                    _.filter(result._items, (report) => report.user !== session.identity._id),
                    (report) => this.convertDatesForClient(report)
                ),
            }))
    );

    /**
     * @ngdoc method
     * @name savedReports#save
     * @param {object} updates - The updates to apply
     * @param {object} original - The original saved report
     * @return {Promise<object>} - The created/updated report
     * @description Creates or updates a saved report
     */
    this.save = (updates, original = {}) => (
        api('saved_reports').save(
            this.convertDatesForServer(_.get(original, '_id') ? original : {}),
            this.convertDatesForServer(_.pickBy(updates, (value, key) => !key.startsWith('_')))
        )
            .then((savedReport) => {
                notify.success(gettext('Report saved!'));

                const convertedReport = this.convertDatesForClient(savedReport);

                // If this is the currently selected report, then update it (mainly for _etag)
                // Otherwise if no report is selected, then select this newly saved report
                if (this.isReportSelected(savedReport) || !_.get(this.currentReport, '_id')) {
                    this.selectReport(convertedReport);
                }

                return convertedReport;
            }, (error) => {
                if (_.get(error, 'status') === 412) {
                    // If etag error, then notify user
                    // eslint-disable-next-line max-len
                    notify.error(gettext('Saved Report has changed since it was opened. Please re-select the Saved Report to continue. Regrettably, your changes cannot be saved.'));
                } else {
                    notify.error(
                        getErrorMessage(error, gettext('Failed to save report'))
                    );
                }
            })
    );

    /**
     * @ngdoc method
     * @name savedReports#remove
     * @param {object} report - The report to remove
     * @return {Promise} - Resolves with the server response
     * @description Deletes a saved report
     */
    this.remove = (report) => (
        api('saved_reports', session.identity).remove(report)
            .then(() => {
                notify.success(gettext('Report deleted!'));

                // If this report is currently selected, then deselect it now
                // (makes sure that the selected report and url params are cleared)
                if (this.isReportSelected(report)) {
                    this.selectReport({});
                }
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to delete the saved report'))
                );
            })
    );

    /**
     * @ngdoc method
     * @name savedReports#isReportSelected
     * @param {Object} report - The report to check against
     * @return {boolean}
     * @description Returns true if the provided report is selected, false if not
     */
    this.isReportSelected = (report) => (
        _.get(this.currentReport, '_id') === _.get(report, '_id')
    );

    /**
     * @ngdoc method
     * @name savedReports#selectReport
     * @param {Object} selectedReport - The report to select
     * @description Select the provided report
     */
    this.selectReport = (selectedReport) => {
        this.currentReport = _.cloneDeep(selectedReport);
        $location.search('template', _.get(selectedReport, '_id') || null);
    };

    /**
     * @ngdoc method
     * @name savedReports#selectReportFromURL
     * @description Fetches and selects a report from the url parameters (if set)
     */
    this.selectReportFromURL = () => {
        const reportId = $location.search().template;

        if (!reportId) {
            return;
        }

        this.fetchById(reportId)
            .then((report) => {
                this.selectReport(report);
            }, (error) => {
                if (_.get(error, 'status') === 404) {
                    notify.error(gettext('Saved report not found!'));
                } else {
                    notify.error(
                        getErrorMessage(error, gettext('Failed to load the saved report!'))
                    );
                }
            });
    };

    /**
     * @ngdoc method
     * @name savedReports#onReportUpdated
     * @param {Event} event - Browser Websocket event
     * @param {Object} data - Saved report and operation type
     * @description Responds to updates on saved reports
     */
    this.onReportUpdated = (event, data) => {
        const operation = _.get(data, 'operation');
        const reportId = _.get(data, 'report_id');
        const sessionId = _.get(data, 'session_id');

        const currentSessionId = _.get(session, 'sessionId');
        const currentReportId = _.get(this.currentReport, '_id');

        // Ignore this event if it was triggered in this session, or
        // is not for the currently selected report
        if (sessionId === currentSessionId || reportId !== currentReportId) {
            return;
        }

        if (operation === 'update') {
            notify.warning(
                gettext('The Saved Report you are using was updated! Please re-select the Saved Report')
            );
        } else if (operation === 'delete') {
            // If this report is currently selected, then deselect it now
            // (makes sure that the selected report and url params are cleared)
            this.selectReport({});

            notify.warning(
                gettext('The Saved Report you are using was deleted!')
            );
        }
    };

    init();
}
