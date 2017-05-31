TrackActivityWidgetController.$inject = ['$scope', '$rootScope', 'api', 'session', 'analyticsWidgetSettings',
    'desks', 'notify', 'trackActivityChart', '$interval', '$timeout', 'trackActivityReport',
    'trackActivityReportWidgetSettings'];

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
 * @requires $timeout
 * @requires trackActivityReport
 * @requires trackActivityReportWidgetSettings
 * @description Controller for track activity widget
 */
export function TrackActivityWidgetController($scope, $rootScope, api, session, analyticsWidgetSettings,
    desks, notify, trackActivityChart, $interval, $timeout, trackActivityReport, trackActivityReportWidgetSettings) {
    const REGENERATE_INTERVAL = 60000;

    var self = this;

    this.widget = null;
    this.interval = null;
    this.chart = null;
    $scope.renderTo = null;

    /**
     * @ngdoc method
     * @name TrackActivityWidgetController#resetInterval
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
     * @name TrackActivityWidgetController#setWidget
     * @param {object} widget
     * @description Set the widget
     */
    this.setWidget = function(widget) {
        self.widget = trackActivityReportWidgetSettings.getSettings(widget.multiple_id);
        if (!self.widget) {
            self.widget = widget;
        }
        $scope.renderTo = 'track-activity' + self.widget.multiple_id;
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetController#onMove
     * @param {Object} event
     * @param {Object} data
     * @description Generate the chart
     */
    var onMove = function(event, data) {
        if (data.from_stage === self.widget.configuration.stage ||
            data.to_stage === self.widget.configuration.stage) {
            resetInterval();
            $scope.generateChart();
        }
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetController#generateChart
     * @description Generate the chart
     */
    $scope.generateChart = function() {
        function onFail(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The track activity report could not be generated.'));
            }
        }

        return trackActivityReport.generate(self.widget.configuration)
        .then((trackActivityReport) => {
            self.chart = trackActivityChart.createChart(trackActivityReport, $scope.renderTo);
        }, onFail);
    };

    $timeout($scope.generateChart, 0);
    resetInterval();

    $scope.$on('view:track_activity_widget', (event, args) => {
        resetInterval();
        $scope.generateChart();
    });

    $scope.$on('content:update', () => {
        resetInterval();
        $scope.generateChart();
    });
    $scope.$on('task:stage', onMove);
    $scope.$on('item:move', onMove);

    $scope.$on('$destroy', () => {
        if (angular.isDefined(self.interval)) {
            $interval.cancel(self.interval);
            self.interval = null;
        }
        if (self.chart) {
            self.chart.destroy();
            self.chart = null;
        }
    });
}
