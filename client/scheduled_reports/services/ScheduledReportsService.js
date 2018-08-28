ScheduledReportsService.$inject = ['api', 'lodash', 'session'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.scheduled_reports
 * @name sdScheduledReportsService
 * @requires api
 * @requires lodash
 * @requires session
 * @description Service to create, read, update and delete scheduled reports
 */
export function ScheduledReportsService(api, _, session) {
    this.fetchById = (scheduleId) => (
        api('scheduled_reports').getById(scheduleId)
    );

    /**
     * @ngdoc method
     * @name sdScheduledReportsService#fetchAll
     * @param {String} reportTypeId - The ID of the report type
     * @description Fetches all the scheduled reports for a particular report type
     */
    this.fetchAll = (reportTypeId = null) => {
        const query = {};

        if (reportTypeId !== null) {
            query.where = JSON.stringify({report_type: reportTypeId});
        }

        return api('scheduled_reports').getAll(query);
    };

    /**
     * @ngdoc method
     * @name sdScheduledReportsService#fetchBySavedReport
     * @param {String} savedReportId - The ID of the saved report
     * @description Fetches all the scheduled report for a particular saved report
     */
    this.fetchBySavedReport = (savedReportId) => (
        api('scheduled_reports').getAll({
            where: JSON.stringify({
                saved_report: savedReportId
            }),
        })
    );

    this.fetchEmailList = () => (
        api('scheduled_reports').getAll()
            .then((schedules) => {
                let emails = [];

                schedules.forEach((schedule) => {
                    emails = emails.concat(_.get(schedule, 'recipients', []));
                });

                return _.uniq(emails);
            })
    );

    /**
     * @ngdoc method
     * @name sdScheduledReportsService#save
     * @param {Object} updates - The schedule updates to apply
     * @param {Object} original - The original schedule (if any)
     * @description Creates or updates a report schedule
     */
    this.save = (updates, original = {}) => (
        api('scheduled_reports').save(
            _.get(original, '_id') ? original : {},
            _.pickBy(updates, (value, key) => !key.startsWith('_'))
        )
    );

    /**
     * @ngdoc method
     * @name sdScheduledReportsService#remove
     * @param {Object} schedule - The schedule to delete
     * @description Deletes the privided report schedule
     */
    this.remove = (schedule) => (
        api('scheduled_reports', session.identity).remove(schedule)
    );
}
