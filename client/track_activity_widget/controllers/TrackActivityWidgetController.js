TrackActivityWidgetController.$inject = ['$scope', '$rootScope', 'api', 'session', 'analyticsWidgetSettings',
    'desks', 'notify', 'trackActivityChart', '$interval'];

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
export function TrackActivityWidgetController($scope, $rootScope, api, session, analyticsWidgetSettings,
    desks, notify, trackActivityChart, $interval) {
    var widgetType = 'track_activity';

    /**
     * @ngdoc method
     * @name TrackActivityWidgetController#getSettings
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
     * @name TrackActivityWidgetController#generateReport
     * @description Generate the report
     */
    var generateReport = function() {
        function onSuccess(trackActivityReport) {
            $scope.trackActivityReport = trackActivityReport;
            return $scope.trackActivityReport;
        }

        function onFail(error) {
            if (angular.isDefined(error.data._message)) {
                notify.error(error.data._message);
            } else {
                notify.error(gettext('Error. The track activity report could not be generated.'));
            }
        }

        return getSettings().then((settings) =>
            api('track_activity_report', session.identity).save({}, settings)
                .then(onSuccess, onFail)
        );
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetController#onMove
     * @param {Object} event
     * @param {Object} data
     * @description Generate the chart
     */
    var onMove = function(event, data) {
        if (data.from_stage === $scope.widget.stage || data.to_stage === $scope.widget.stage) {
            generateChart();
        }
    };

    /**
     * @ngdoc method
     * @name TrackActivityWidgetController#generateChart
     * @description Generate the chart
     */
    var generateChart = function() {
        generateReport().then((trackActivityReport) => {
            $scope.trackActivityReport = trackActivityReport;
            trackActivityChart.createChart(trackActivityReport, 'container', null);
        });
    };

    generateChart();

    $scope.$on('view:track_activity_widget', (event, args) => {
        generateChart();
    });

    $scope.$on('task:stage', onMove);
    $scope.$on('item:move', onMove);

    $interval(generateChart, 60000);
}
