import {gettext} from '../../utils';

ScheduledReportsList.$inject = [
    'modal',
    'lodash',
    'reports',
    'scheduledReports',
    'notify',
    'savedReports',
    'moment',
    'emailReport',
    '$q',
    '$rootScope',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.scheduled_reports
 * @name sdaScheduledReportsList
 * @requires modal
 * @requires lodash
 * @requires reports
 * @requires scheduledReports
 * @requires notify
 * @requires savedReports
 * @requires emailReport
 * @requires $q
 * @requires $rootScope
 * @description A directive that renders the list of scheduled report cards
 */
export function ScheduledReportsList(
    modal,
    _,
    reports,
    scheduledReports,
    notify,
    savedReports,
    moment,
    emailReport,
    $q,
    $rootScope
) {
    return {
        template: require('../views/scheduled-reports-list.html'),
        scope: {
            currentReport: '=',
            currentSavedReport: '=',
            clearSavedReport: '=',
        },
        link: function(scope) {
            /**
            * @ngdoc method
            * @name sdaScheduledReportsList#init
            * @description Initializes the scope parameters
            */
            this.init = () => {
                scope.currentSchedule = null;
                scope.flags = {
                    showModal: false,
                    loading: true,
                };
                scope.reports = reports.filter((report) => !!report.allowScheduling);
                scope.schedules = [];

                scope.$on('analytics:schedules:open_create_modal', angular.bind(this, this.openCreateModal));
                scope.$on('analytics:schedules:view_schedule', angular.bind(this, this.viewScheduleForReport));
                scope.$on('analytics:schedules:create_new', angular.bind(this, this.createNewFromSavedReport));
                scope.$on('scheduled_reports:update', angular.bind(this, this.loadSchedulesAndReports));
                scope.$watch('currentSavedReport', angular.bind(this, this.loadSchedulesAndReports));
                scope.$watch('currentReport', angular.bind(this, this.loadSchedulesAndReports));

                // If a SavedReport gets updated, then reload the ScheduledReports
                $rootScope.$on('savedreports:update', angular.bind(this, this.onSavedReportsUpdate));
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#onSavedReportsUpdate
             * @param {object} event - The websocket event object
             * @param {object} data - The websocket data (saved report details)
             * @description Reload all ScheduledReports when a SavedReport gets updated
             */
            this.onSavedReportsUpdate = function(event, data) {
                const reportType = _.get(data, 'report_type');

                if (reportType !== _.get(scope, 'currentReport.id')) {
                    return;
                }

                this.loadSchedulesAndReports();
            };

            /**
             * @ngdoc property
             * @name sdaScheduledReportsList#mimeTypes
             * @type {Array<Object>}
             * @description Array of the supported MIME types
             * Disabling SVG/CSV as these currently do not work
             */
            scope.mimeTypes = [
                {type: 'image/jpeg', label: gettext('JPEG Image')},
                {type: 'image/png', label: gettext('PNG Image')},
                // {type: 'image/svg+xml', label: gettext('SVG Image')},
                // {type: 'text/csv', label: gettext('CSV File')},
                {type: 'application/pdf', label: gettext('PDF File')},
            ];

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#getSavedReportType
             * @param {Object} schedule - The schedule to get the report type
             * @return {String} Name of the saved report
             * @description Gets the name of the report type from the saved report for the provided schedule
             */
            scope.getSavedReportType = (schedule) => (
                _.find(scope.reports, (report) => report.id === schedule.report_type).label
            );

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#loadSchedules
             * @description Loads all the schedules for the current report type
             */
            this.loadSchedules = () => (
                scheduledReports.fetchAll(_.get(scope, 'currentReport.id'))
                    .then((schedules) => (
                        _.filter(
                            schedules,
                            (schedule) => !scope.currentSavedReport ||
                                schedule.saved_report === scope.currentSavedReport._id
                        )
                    ))
            );

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#loadSavedReports
             * @description Loads all the saved reports for the current report type
             */
            this.loadSavedReports = () => (
                savedReports.fetchAll(_.get(scope, 'currentReport.id'))
                    .then((reports) => (
                        _.keyBy(
                            _.concat(
                                reports.global,
                                _.filter(reports.user, (report) => report.is_global)
                            ),
                            '_id'
                        )
                    ))
            );

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#loadSchedulesAndReports
             * @description Loads all schedules and saved reports for the current report type
             */
            this.loadSchedulesAndReports = () => {
                scope.flags.loading = true;

                $q.all({
                    reports: this.loadSavedReports(),
                    schedules: this.loadSchedules(),
                })
                    .then((data) => {
                        _.forEach(data.schedules, (schedule) => {
                            schedule._report = _.get(data.reports, `[${schedule.saved_report}]`) || null;
                        });

                        scope.schedules = data.schedules;
                        scope.flags.loading = false;
                    });
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#openModal
             * @param {Object} schedule - The schedule to edit
             * @description Opens the editor modal for the provided schedule
             */
            scope.openModal = (schedule) => {
                scope.currentSchedule = schedule;
                scope.flags.showModal = true;
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#closeModal
             * @description Closes the editor modal
             */
            scope.closeModal = () => {
                scope.currentSchedule = null;
                scope.flags.showModal = false;
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#remove
             * @param {Object} schedule - The schedule to delete
             * @description Displays a confirmation modal, and if confirmed delets the provided schedule
             */
            scope.remove = (schedule) => (
                modal.confirm(
                    gettext('Are you sure you want to delete the scheduled report?')
                ).then(() => scheduledReports.remove(schedule))
            );

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#getFileType
             * @param {Object} schedule - The schedule to get the file type for
             * @return {String} The name of the file type
             * @description Gets the name of the file type for the provided schedule's MIME type
             */
            scope.getFileType = (schedule) => {
                const mimetype = _.get(schedule, 'mimetype');

                return _.find(scope.mimeTypes, (mime) => mime.type === mimetype).label;
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#openCreateModal
             * @param {Object} savedReport - The saved report
             * @description Opens the editor modal with the provided saved report already filled in
             */
            this.openCreateModal = (savedReport) => {
                scope.currentSchedule = {
                    active: false,
                    name: '',
                    description: '',
                    schedule: {
                        frequency: 'daily',
                    },
                    mimetype: scope.mimeTypes[0].type,
                    report_width: 800,
                    report_type: scope.currentReport.id,
                    transmitter: 'email',
                    saved_report: savedReport._id || null,
                };
                scope.flags.showModal = true;
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#viewScheduleForReport
             * @param {Object} event - The Angular broadcast event
             * @param {Object} savedReport - The saved report to filter by
             * @description Filters the schedules based on the provided saved report
             */
            this.viewScheduleForReport = (event, savedReport) => {
                scheduledReports.fetchBySavedReport(savedReport._id)
                    .then((schedules) => {
                        const numSchedules = _.get(schedules, '_items.length', 0);

                        if (numSchedules < 1) {
                            // There are currently no schedules for this saved report
                            this.openCreateModal(savedReport);
                        } else if (numSchedules === 1) {
                            // If there is only 1 schedule, then open the modal edit form
                            scope.openModal(schedules._items[0]);
                        }
                    });
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#createNewFromSavedReport
             * @param {Object} event - The Angular broadcast event
             * @param {Object} savedReport - The saved report
             * @description Creates a new schedule for the provided saved report
             */
            this.createNewFromSavedReport = (event, savedReport) => {
                this.openCreateModal(savedReport);
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#getLastRunDescription
             * @param {Object} schedule - The scheduled report
             * @return {String} Human readable date/time format
             * @description Returns the human readable date/time the scheduled report was last run
             */
            scope.getLastRunDescription = (schedule) => {
                const lastSent = _.get(schedule, '_last_sent');

                if (!lastSent) {
                    return '<never>';
                }

                return moment(lastSent).format('llll');
            };

            /**
             * @ngdoc method
             * @name sdaScheduledReportsList#openEmailModal
             * @param {Object} schedule - The schedule to send an email for
             * @description Opens the sdEmailReportModal with the provided schedule
             */
            scope.openEmailModal = (schedule) => {
                const savedReport = _.get(schedule, '_report') || {};

                const report = {
                    type: _.get(schedule, 'report_type'),
                    params: _.get(savedReport, 'params') || {},
                    mimetype: _.get(schedule, 'mimetype') || scope.mimeTypes[0].type,
                    width: _.get(schedule, 'report_width') || 800,
                    translations: _.get(savedReport, 'translations') || {},
                };

                const email = {
                    recipients: _.get(schedule, 'recipients') || [],
                    subject: _.get(schedule, 'extra.subject') || '',
                    txt: {body: _.get(schedule, 'extra.body') || ''},
                    html: {body: _.get(schedule, 'extra.body') || ''},
                };

                emailReport.openEmailModal(report, email);
            };

            this.init();
        },
    };
}
