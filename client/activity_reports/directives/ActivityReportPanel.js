ActivityReportPanel.$inject = [
    'desks', 'metadata', 'notify', '$rootScope', 'activityReport'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdActivityReportPanel
 * @requires desks
 * @requires metadata
 * @requires notify
 * @requires $rootScope
 * @requires activityReport
 * @description A directive that generates the sidebar containing activity report parameters
 */
export function ActivityReportPanel(desks, metadata, notify, $rootScope, activityReport) {
    return {
        template: require('../views/activity-report-panel.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            scope.panelTab = 'editingActivityReport';
            scope.innerTab = 'parameters';
            scope.showActivityReport = false;

            desks.initialize().then(() => {
                scope.desks = desks.desks._items;
                scope.initActivityReport();
            });

            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });

            scope.$on('edit:activity_report', (event, args) => {
                scope.panelTab = 'editingActivityReport';
                scope.innerTab = 'parameters';
                scope.activityReport = args;
                scope.group_by = {desk: args.hasOwnProperty('group_by') && args.group_by.indexOf('desk') >= 0};
            });

            scope.$watch('group_by.desk', (groupByDesk) => {
                if (scope.activityReport) {
                    if (groupByDesk === true) {
                        scope.activityReport.group_by = ['desk'];
                        delete scope.activityReport.desk;
                    } else if (scope.activityReport.hasOwnProperty('group_by')) {
                        delete scope.activityReport.group_by;
                        scope.activityReport.desk = desks.activeDeskId;
                    }
                }
            });

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#initActivityReport
             * @description Initialises the activity report object
             */
            scope.initActivityReport = function() {
                scope.activityReport = {operation: 'publish', desk: desks.activeDeskId};
                scope.group_by = {desk: false};
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
             * @name sdActivityReportPanel#display
             * @param {String} tabName - valid values are 'parameters' and 'grouping'
             * @description Changes the inner tab to the given one
             */
            scope.display = function(tabName) {
                scope.innerTab = tabName;
            };

            /**
             * @ngdoc method
             * @name sdActivityReportPanel#generate
             * @returns {Promise}
             * @description Generate the report
             */
            scope.generate = function() {
                function onSuccess(activityReport) {
                    $rootScope.$broadcast('view:activity_report', activityReport);
                    notify.success(gettext('The activity report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The activity report could not be generated.'));
                    }
                }

                return activityReport.generate(scope.activityReport).then(onSuccess, onFail);
            };
        }
    };
}
