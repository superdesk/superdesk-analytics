ActivityReportPanel.$inject = [
    'desks', 'notify', '$rootScope', 'activityReport', 'activityChart',
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdActivityReportPanel
 * @requires desks
 * @requires notify
 * @requires $rootScope
 * @requires activityReport
 * @description A directive that generates the sidebar containing activity report parameters
 */
export function ActivityReportPanel(desks, notify, $rootScope, activityReport, activityChart) {
    return {
        require: '^sdAnalyticsContainer',
        template: require('../views/activity-report-panel.html'),
        link: function(scope, element, attrs) {
            scope.panelTab = 'editingActivityReport';

            desks.initialize().then(() => {
                scope.desks = desks.desks._items;
                scope.initReport();
            });

            /**
             * @ngdoc method
             * @name ActivityReportPanel#initReport
             * @description Initialises the activity report settings
             */
            scope.initReport = function() {
                scope.report = {
                    operation: 'publish',
                    desk: desks.activeDeskId,
                    days: 1,
                    group_by: {desk: false},
                };
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#editReportSelected
             * @returns {Boolean}
             * @description Returns true if the report editing tab was selected
             */
            scope.editReportSelected = function() {
                return scope.panelTab === 'editingActivityReport';
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#savedReportsSelected
             * @returns {Boolean}
             * @description Returns true if the saved reports tab was selected
             */
            scope.savedReportsSelected = function() {
                return scope.panelTab !== 'editingActivityReport';
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#changeTab
             * @param {String} tabName - valid values are 'editingActivityReport' and 'savedReports'
             * @description Changes the tab to the given one
             */
            scope.changeTab = function(tabName) {
                scope.panelTab = tabName;
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#generate
             * @returns {Promise}
             * @description Generate the report
             */
            scope.generate = function(report) {
                function onSuccess(activityReport) {
                    scope.changeReportParams({
                        charts: activityChart.createChart(activityReport),
                    });
                    notify.success(gettext('The activity report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The activity report could not be generated.'));
                    }
                }

                return activityReport.generate(report).then(onSuccess, onFail);
            };

            scope.$on('activity-report:edit', (event, args) => {
                scope.panelTab = 'editingActivityReport';
                scope.report = args;
            });

            scope.$on('activity-report:saved', (event) => {
                scope.panelTab = 'savedActivityReport';
                scope.initReport();
            });

            scope.$on('activity-report:clear', (event) => {
                scope.initReport();
            });
        },
    };
}
