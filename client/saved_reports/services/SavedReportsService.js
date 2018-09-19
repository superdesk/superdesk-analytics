import {getErrorMessage} from '../../utils';

SavedReportsService.$inject = [
    'lodash',
    'api',
    'session',
    'moment',
    'config',
    '$location',
    'notify',
    'gettext',
    '$rootScope'
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
    config,
    $location,
    notify,
    gettext,
    $rootScope
) {
    const init = () => {
        this.currentReport = {};
        $rootScope.$on('savedreports:update', angular.bind(this, this.onReportUpdated));
    };

    const convertDatesForServer = (params) => {
        const report = _.cloneDeep(params);

        if (_.get(report, 'params.start_date')) {
            report.params.start_date = moment(report.params.start_date, config.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'params.end_date')) {
            report.params.end_date = moment(report.params.end_date, config.model.dateformat)
                .format('YYYY-MM-DD');
        }

        if (_.get(report, 'params.date')) {
            report.params.date = moment(report.params.date, config.model.dateformat)
                .format('YYYY-MM-DD');
        }

        return report;
    };

    const convertDatesForClient = (params) => {
        const report = _.cloneDeep(params);

        if (_.get(report, 'params.start_date')) {
            report.params.start_date = moment(report.params.start_date, 'YYYY-MM-DD')
                .format(config.model.dateformat);
        }

        if (_.get(report, 'params.end_date')) {
            report.params.end_date = moment(report.params.end_date, 'YYYY-MM-DD')
                .format(config.model.dateformat);
        }

        if (_.get(report, 'params.date')) {
            report.params.date = moment(report.params.date, 'YYYY-MM-DD')
                .format(config.model.dateformat);
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
            .then((report) => convertDatesForClient(report))
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
            where: JSON.stringify({report: reportType})
        })
            .then((result) => ({
                user: _.map(
                    _.filter(result._items, (report) => report.user === session.identity._id),
                    (report) => convertDatesForClient(report)
                ),
                global: _.map(
                    _.filter(result._items, (report) => report.user !== session.identity._id),
                    (report) => convertDatesForClient(report)
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
            convertDatesForServer(_.get(original, '_id') ? original : {}),
            convertDatesForServer(_.pickBy(updates, (value, key) => !key.startsWith('_')))
        )
            .then((savedReport) => {
                notify.success(gettext('Report saved!'));

                const convertedReport = convertDatesForClient(savedReport);

                // If this is the currently selected report, then update it (mainly for _etag)
                // Otherwise if no report is selected, then select this newly saved report
                if (this.isReportSelected(savedReport) || !_.get(this.currentReport, '_id')) {
                    this.selectReport(convertedReport);
                }

                return convertedReport;
            }, (error) => {
                notify.error(
                    getErrorMessage(error, gettext('Failed to save report'))
                );
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

    this.isReportSelected = (report) => (
        _.get(this.currentReport, '_id') === _.get(report, '_id')
    );

    this.selectReport = (selectedReport) => {
        this.currentReport = _.cloneDeep(selectedReport);
        $location.search('template', _.get(selectedReport, '_id') || null);
    };

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
                gettext('The Saved Report you are using was updated!')
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
