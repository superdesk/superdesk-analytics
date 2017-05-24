ContentQuotaWidgetController.$inject = ['config', '$scope', '$rootScope', 'api', 'session', 'analyticsWidgetSettings',
    'desks', 'notify', 'contentQuotaChart', '$interval'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.track-activity-widget
 * @name TrackActivityWidgetController
 * @requires $scope
 * @requires $rootScope
 * @requires api
 * @requires session
 * @requires analyticsWidgetSettings
 * @requires desks
 * @requires notify
 * @requires trackActivityChart
 * @requires $interval
 * @description Controller for track activity widget
 */
export function ContentQuotaWidgetController(config, $scope, $rootScope, api, session, analyticsWidgetSettings,
    desks, notify, contentQuotaChart, $interval) {
    var widgetType = 'content_quota',
        regenerateInterval = 60000,
        interval = null;

    /**
     * @ngdoc method
     * @name ContentQuotaWidgetController#getSettings
     * @description Read widget settings
     */
    var getSettings = function() {
        return analyticsWidgetSettings.readSettings(widgetType).then((preferences) => {
            $scope.widget = preferences;
            return $scope.widget;
        });
    };
    var formatDate = function(date) {
        return date ? moment(date, config.model.dateformat).format('YYYY-MM-DD') : null; // jshint ignore:line
    };
    /**
     * @ngdoc method
     * @name ContentQuotaWidgetController#generateReport
     * @description Generate the report
     */
    var generateReport = function() {
        function onSuccess(contentQuotaReport) {
            $scope.contentQuotaReport = contentQuotaReport;
            return $scope.contentQuotaReport;
        }

        function onFail(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The report could not be generated.'));
            }
        }

        return getSettings().then((settings) => {
            var req;

            req = _.clone(settings);
            req.start_time = formatDate(req.start_time);
            return api('content_quota_reports', session.identity).save({}, req)
                    .then(onSuccess, onFail);
        });
    };

    /**
     * @ngdoc method
     * @name ContentQuotaWidgetController#generateChart
     * @description Generate the chart
     */
    var generateChart = function() {
        generateReport().then((contentQuotaReport) => {
            $scope.contentQuotaReport = contentQuotaReport;
            contentQuotaChart.createChart(contentQuotaReport, 'containerq');
        });
    };


    /**
     * @ngdoc method
     * @name ContentQuotaWidgetController#resetInterval
     * @description Reset the periodic generation of the chart
     */
    var resetInterval = function() {
        if (angular.isDefined(interval)) {
            $interval.cancel(interval);
        }
        interval = $interval(generateChart, regenerateInterval);
    };

    resetInterval();
    generateChart();


    $scope.$on('view:content_quota_widget', (event, args) => {
        resetInterval();
        generateChart();
    });

    $scope.$on('$destroy', () => {
        if (angular.isDefined(interval)) {
            $interval.cancel(interval);
        }
    });
}
