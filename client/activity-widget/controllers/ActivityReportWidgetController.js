ActivityReportWidgetController.$inject = [
    '$scope', 'analyticsWidgetSettings', 'notify', 'activityChart', '$interval', '$timeout', '$rootScope',
    'activityReport', 'activityReportWidgetSettings'
];

/**
 * @ngdoc controller
 * @module superdesk.apps.analytics.activity-widget
 * @name ActivityWidgetController
 * @requires $scope
 * @requires analyticsWidgetSettings
 * @requires desks
 * @requires notify
 * @requires activityChart
 * @requires $interval
 * @requires $timeout
 * @requires $rootScope
 * @requires activityReport
 * @requires activityReportWidgetSettings
 * @description Controller for activity widget
 */
export function ActivityReportWidgetController($scope, analyticsWidgetSettings, notify, activityChart,
    $interval, $timeout, $rootScope, activityReport, activityReportWidgetSettings) {
    const REGENERATE_INTERVAL = 60000;

    var self = this;

    this.widget = null;
    this.interval = null;
    this.chart = null;
    $scope.renderTo = null;

    /**
     * @ngdoc method
     * @name ActivityWidgetController#resetInterval
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
     * @name ActivityWidgetController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        self.widget = activityReportWidgetSettings.getSettings(widget.multiple_id);
        if (!self.widget) {
            self.widget = widget;
        }
        $scope.renderTo = 'activity' + widget.multiple_id;
    };

    /**
     * @ngdoc method
     * @name ActivityWidgetController#generateChart
     * @returns {Promise}
     * @description Generate the chart
     */
    $scope.generateChart = function() {
        function onFail(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The activity report could not be generated.'));
            }
        }

        let reportConfig = Object.assign({}, self.widget.configuration);

        if (_.has(reportConfig, 'label')) {
            delete reportConfig.label;
        }
        return activityReport.generate(reportConfig)
        .then((activityReport) => {
            self.chart = activityChart.createChart(activityReport, $scope.renderTo, $scope.renderTo);
        }, onFail);
    };

    $timeout($scope.generateChart, 0);
    resetInterval();

    this.viewEventCleanup = $rootScope.$on('view:activity_widget', (event, widget) => {
        self.widget = widget;
        $scope.generateChart();
        resetInterval();
    });

    $scope.$on('item:publish', () => {
        resetInterval();
        $scope.generateChart();
    });

    $scope.$on('$destroy', () => {
        if (angular.isDefined(self.interval)) {
            $interval.cancel(self.interval);
            self.interval = null;
        }
        if (self.viewEventCleanup) {
            self.viewEventCleanup();
            self.viewEventCleanup = null;
        }
    });
}
