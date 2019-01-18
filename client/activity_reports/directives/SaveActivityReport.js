import {formatDateForServer} from '../../utils';

SaveActivityReport.$inject = ['$location', 'asset', 'api', 'session', 'notify', 'config',
    '$rootScope', 'moment'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdSaveActivityReport
 * @requires $location
 * @requires asset
 * @requires api
 * @requires session
 * @requires notify
 * @requires config
 * @requires $rootScope
 * @requires moment
 * @description A directive that generates the activity report save dialog
 */
export function SaveActivityReport($location, asset, api, session, notify, config, $rootScope,
        moment) {
    return {
        template: require('../views/save-activity-report.html'),
        scope: {
            form: '=',
            report: '=',
        },
        link: function(scope, element, attrs, controller) {
            /**
             * @ngdoc method
             * @name sdSaveActivityReport#save
             * @param {Object} activityReport
             * @description Patches or posts the given activity report
             */
            scope.save = function() {
                function onSuccess() {
                    notify.success(gettext('The activity report was saved successfully'));
                    $rootScope.$broadcast('activity-report:saved');
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The activity report could not be saved.'));
                    }
                }

                var originalActivityReport = {};
                var activityReportEdit = _.clone(scope.report);

                if (activityReportEdit._id) {
                    originalActivityReport = activityReportEdit;
                }
                activityReportEdit.owner = session.identity._id;
                if (scope.report.operation_end_date) {
                    activityReportEdit.operation_end_date = formatDateForServer(moment, config,
                        scope.report.operation_end_date, 1);
                }
                $rootScope.$broadcast('savedactivityreport:update');

                api('saved_activity_reports', session.identity).save(originalActivityReport, activityReportEdit)
                    .then(onSuccess, onFail);
            };

            /**
             * @ngdoc method
             * @name sdSaveActivityReport#formatDate
             * @description Clears the activity report form
             */
            scope.clear = function() {
                $rootScope.$broadcast('activity-report:clear');
                $location.url($location.path());
            };
        },
    };
}
