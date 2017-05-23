ContentQuotaReportPanel.$inject = [
    'config', 'api', 'session', 'metadata', 'notify', '$rootScope', 'desks', 'contentQuotaReport'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-quota-reports
 * @name sdContentQuotaReportPanel
 * @requires config
 * @requires api
 * @requires session
 * @requires notify
 * @requires $rootScope
 * @requires desks
 * @requires contentQuotaReport
 * @description A directive that generates the sidebar containing track activity report parameters
 */
export function ContentQuotaReportPanel(config, api, session, metadata, notify, $rootScope, desks, contentQuotaReport) {
    return {
        template: require('../views/content-quota-report-panel.html'),
        scope: {},
        link: function(scope, element, attrs, controller) {
            var noOfIntervalsDefault = 1,
                intervalLengthDefault = 5;

            scope.report = {};
            scope.init = function() {
                scope.report = {intervals_number: noOfIntervalsDefault, interval_length: intervalLengthDefault};
            };

            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });

            scope.generate = function() {
                function onSuccess(contentQuotaReport) {
                    $rootScope.$broadcast('view:content_quota_reports', contentQuotaReport);
                    notify.success(gettext('The report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The report could not be generated.'));
                    }
                }

                var req = _.clone(scope.report.start_time)

                var query = {
                            start_time: formatDate(req),
                            intervals_number: scope.report.intervals_number,
                            interval_length: scope.report.interval_length,
                            target: scope.target,
                            keywords: scope.report.keywords,
                            subject: scope.report.subject,
                            category: scope.report.category
                };
                api('content_quota_reports', session.identity).save({}, query)
                    .then(onSuccess, onFail);
            };
            function formatDate(date) {
                return date ? moment(date, config.model.dateformat).format('YYYY-MM-DD') : null; // jshint ignore:line
            }

            scope.init();
        }
    };
}
