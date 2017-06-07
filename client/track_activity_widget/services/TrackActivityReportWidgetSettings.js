TrackActivityReportWidgetSettings.$inject = ['workspaces'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.track-activity-widget
 * @name TrackActivityReportWidgetSettings
 * @requires workspaces
 * @description A service that manages the track activity report widget settings
 */
export function TrackActivityReportWidgetSettings(workspaces) {
    this.widgetsSettings = {};

    var self = this;

    /**
     * @ngdoc method
     * @name TrackActivityReportWidgetSettings#getSettings
     * @param {Integer} widgetMultipleId
     * @returns {Object}
     * @description Reads widget settings
     */
    this.getSettings = function(widgetMultipleId) {
        return self.widgetsSettings[widgetMultipleId];
    };

    /**
     * @ngdoc method
     * @name TrackActivityReportWidgetSettings#saveSettings
     * @param {Object} widgetSettings
     * @description Save widget settings
     */
    this.saveSettings = function(widgetSettings) {
        self.widgetsSettings[widgetSettings.multiple_id] = angular.copy(widgetSettings);
    };
}
