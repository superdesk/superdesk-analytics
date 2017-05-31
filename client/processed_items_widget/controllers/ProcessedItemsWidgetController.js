ProcessedItemsWidgetController.$inject = ['$scope', '$rootScope', 'analyticsWidgetSettings', 'notify',
    'processedItemsChart', '$interval', 'processedItemsReport', '$timeout', 'processedItemsReportWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.processed-items-widget
 * @name ProcessedItemsWidgetController
 * @requires $scope
 * @requires $rootScope
 * @requires analyticsWidgetSettings
 * @requires notify
 * @requires processedItemsChart
 * @requires $interval
 * @requires processedItemsReport
 * @requires $timeout
 * @requires processedItemsReportWidgetSettings
 * @description Controller for processed items widget
 */
export function ProcessedItemsWidgetController($scope, $rootScope, analyticsWidgetSettings, notify,
    processedItemsChart, $interval, processedItemsReport, $timeout, processedItemsReportWidgetSettings) {
    const REGENERATE_INTERVAL = 60000;

    var self = this;

    this.widget = null;
    this.interval = null;
    this.chart = null;
    $scope.renderTo = null;

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#resetInterval
     * @description Reset the periodic generation of the chart
     */
    var resetInterval = function() {
        if (angular.isDefined(self.interval)) {
            $interval.cancel(self.interval);
        }
        self.interval = $interval($scope.generateChart, REGENERATE_INTERVAL);
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        self.widget = processedItemsReportWidgetSettings.getSettings(widget.multiple_id);
        if (!self.widget) {
            self.widget = widget;
        }
        $scope.renderTo = 'processed-items' + widget.multiple_id;
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsWidgetController#generateChart
     * @description Generate the chart
     */
    $scope.generateChart = function() {
        function onFail(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The processed items report could not be generated.'));
            }
        }

        return processedItemsReport.generate(self.widget.configuration)
        .then((report) => {
            if (self.chart) {
                self.chart.destroy();
            }
            self.chart = processedItemsChart.createChart(report, $scope.renderTo);
        }, onFail);
    };

    $timeout($scope.generateChart, 0);
    resetInterval();

    this.viewEventCleanup = $rootScope.$on('view:processed_items_widget', (event, widget) => {
        self.widget = widget;
        $scope.generateChart();
        resetInterval();
    });

    $scope.$on('item:publish', (event, data) => {
        $scope.generateChart();
        resetInterval();
    });

    $scope.$on('$destroy', () => {
        if (angular.isDefined(self.interval)) {
            $interval.cancel(self.interval);
            self.interval = null;
        }
        if (self.chart) {
            self.chart.destroy();
            self.chart = null;
        }
        if (self.viewEventCleanup) {
            self.viewEventCleanup();
            self.viewEventCleanup = null;
        }
    });
}
