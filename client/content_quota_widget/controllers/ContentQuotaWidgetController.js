ContentQuotaWidgetController.$inject = ['$scope', '$rootScope', 'notify', '$interval', '$timeout',
    'contentQuotaReport', 'contentQuotaChart', 'contentQuotaReportWidgetSettings'];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.content-quota-widget
 * @name ContentQuotaWidgetController
 * @requires $scope
 * @requires $rootScope
 * @requires notify
 * @requires $interval
 * @requires $timeout
 * @requires contentQuotaReport
 * @requires contentQuotaChart
 * @requires contentQuotaReportWidgetSettings
 * @description Controller for content quota widget
 */
export function ContentQuotaWidgetController($scope, $rootScope, notify, $interval, $timeout,
    contentQuotaReport, contentQuotaChart, contentQuotaReportWidgetSettings) {
    const REGENERATE_INTERVAL = 60000;

    var self = this;

    this.widget = null;
    this.interval = null;
    this.chart = null;
    $scope.renderTo = null;

    /**
     * @ngdoc method
     * @name ContentQuotaWidgetController#resetInterval
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
     * @name ContentQuotaWidgetController#resetChart
     * @description Reset the chart variable
     */
    var resetChart = function(newChart) {
        self.chart = newChart;
    };

    /**
     * @ngdoc method
     * @name ContentQuotaWidgetController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        self.widget = contentQuotaReportWidgetSettings.getSettings(widget.multiple_id);
        if (!self.widget) {
            self.widget = widget;
        }
        $scope.renderTo = 'content-quota' + self.widget.multiple_id;
    };

    /**
     * @ngdoc method
     * @name ContentQuotaWidgetController#generateChart
     * @description Generate the chart
     */
    $scope.generateChart = function() {
        function onFail(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The content quota report could not be generated.'));
            }
        }

        return contentQuotaReport.generate(self.widget.configuration)
        .then((contentQuotaReport) => {
            resetChart(contentQuotaChart.createChart(contentQuotaReport, $scope.renderTo));
        }, onFail);
    };

    $timeout($scope.generateChart, 0);
    resetInterval();

    $scope.$on('view:content_quota_widget', (event, args) => {
        resetInterval();
        $scope.generateChart();
    });

    $scope.$on('$destroy', () => {
        if (angular.isDefined(self.interval)) {
            $interval.cancel(self.interval);
            self.interval = null;
        }
        resetChart(null);
    });
}
