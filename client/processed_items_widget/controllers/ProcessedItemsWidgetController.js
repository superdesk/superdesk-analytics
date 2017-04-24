ProcessedItemsWidgetController.$inject = ['config', '$scope', '$rootScope', 'api', 'session', 'analyticsWidgetSettings',
    'notify', 'processedItemsChart', '$interval'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.processed-items-widget
 * @name ProcessedItemsWidgetController
 * @requires config
 * @requires $scope
 * @requires $rootScope
 * @requires api
 * @requires session
 * @requires analyticsWidgetSettings
 * @requires notify
 * @requires processedItemsChart
 * @requires $interval
 * @description Controller for processed items widget
 */

export function ProcessedItemsWidgetController(config, $scope, $rootScope, api, session, analyticsWidgetSettings,
    notify, processedItemsChart, $interval) {
    var widgetType = 'processed_items',
        regenerateInterval = 60000,
        interval = null;

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#formatDate
     * @param {String} date
     * @description Format given date for generate
     */
    var formatDate = function(date) {
        return date ? moment(date, config.model.dateformat).format('YYYY-MM-DD') : null;
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#getSettings
     * @description Read widget settings
     */
    var getSettings = function() {
        return analyticsWidgetSettings.readSettings(widgetType).then((preferences) => {
            $scope.widget = preferences;
            return $scope.widget;
        });
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#generateReport
     * @description Generate the report
     */
    var generateReport = function() {
        function onSuccess(processedItemsReport) {
            $scope.processedItemsReport = processedItemsReport;
            return $scope.processedItemsReport;
        }

        function onFail(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The processed items report could not be generated.'));
            }
        }

        return getSettings().then((settings) => {
            var req;

            req = _.clone(settings);
            req.start_time = formatDate(req.start_time);
            req.end_time = formatDate(req.end_time);
            return api('processed_items_report', session.identity).save({}, req)
                    .then(onSuccess, onFail);
        });
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#generateChart
     * @description Generate the chart
     */
    var generateChart = function() {
        generateReport().then((processedItemsReport) => {
            $scope.processedItemsReport = processedItemsReport;
            processedItemsChart.createChart(processedItemsReport, 'containerp');
        });
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#resetInterval
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

    $scope.$on('view:processed_items_widget', (event, args) => {
        resetInterval();
        generateChart();
    });

    $scope.$on('$destroy', () => {
        if (angular.isDefined(interval)) {
            $interval.cancel(interval);
        }
    });
}
