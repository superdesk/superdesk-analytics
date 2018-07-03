ContentQuotaReportForm.$inject = [
    'config', 'api', 'session', 'metadata', 'notify', '$rootScope', 'desks', 'contentQuotaReport'
];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.content-quota-report
 * @name sdContentQuotaReportPanel
 * @requires config
 * @requires api
 * @requires session
 * @requires notify
 * @requires $rootScope
 * @requires desks
 * @requires contentQuotaReport
 * @description A directive that generates the sidebar containing content quota reports parameters
 */
export function ContentQuotaReportForm(config, api, session, metadata, notify, $rootScope, desks, contentQuotaReport) {
    return {
        template: require('../views/content-quota-report-form.html'),
        scope: {
            form: '=',
            report: '=',
            forWidget: '@'
        },
        link: function(scope, element, attrs, controller) {
            scope.generalTab = 'general';
            scope.filtersTab = 'filters';
            const defaultTab = scope.generalTab;
            var noOfIntervalsDefault = 7,
                intervalLengthDefault = 1,
                currentTab = null;

            scope.currentTab = () => {
                if (!currentTab) {
                    return defaultTab;
                }
                return currentTab;
            };

            scope.activateGeneralTab = () => {
                currentTab = scope.generalTab;
            };

            scope.activateFiltersTab = () => {
                currentTab = scope.filtersTab;
            };

            /**
             * @ngdoc method
             * @name sdContentQuotaReportPanel#init
             * @description Initialises the content quota report object
            */
            scope.init = function() {
                if (!scope.report) {
                    scope.report = {};
                }
                if (!scope.report.intervals_number) {
                    scope.report.intervals_number = noOfIntervalsDefault;
                }
                if (!scope.report.interval_length) {
                    scope.report.interval_length = intervalLengthDefault;
                }
                scope.form = scope.contentQuotaReportForm;
            };

            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });

            /**
             * @ngdoc method
             * @name sdContentQuotaReportPanel#generate
             * @description Generate the report
             */
            scope.generate = function() {
                function onSuccess(contentQuotaReport) {
                    $rootScope.$broadcast('view:content_quota_report', contentQuotaReport);
                    notify.success(gettext('The report was genereated successfully'));
                }

                function onFail(error) {
                    if (angular.isDefined(error.data._message)) {
                        notify.error(error.data._message);
                    } else {
                        notify.error(gettext('Error. The report could not be generated.'));
                    }
                }

                return contentQuotaReport.generate(scope.report).then(onSuccess, onFail);
            };

            scope.init();
        }
    };
}
