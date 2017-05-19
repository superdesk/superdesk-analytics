ActivityReportWidgetSettings.$inject = ['workspaces'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.activity-widget
 * @name ActivityReportWidgetSettings
 * @requires workspaces
 * @description A service that manages the activity report widget settings
 */
export function ActivityReportWidgetSettings(workspaces) {
    this.widgetsSettings = {};

    var self = this;

    /**
     * @ngdoc method
     * @name ActivityReportWidgetSettings#getSettings
     * @param {Integer} widgetMultipleId
     * @returns {Object}
     * @description Reads widget settings
     */
    this.getSettings = function(widgetMultipleId) {
        return self.widgetsSettings[widgetMultipleId];
    };

    /**
     * @ngdoc method
     * @name ActivityReportWidgetSettings#saveSettings
     * @param {Object} widgetSettings
     * @description Save widget settings
     */
    this.saveSettings = function(widgetSettings) {
        self.widgetsSettings[widgetSettings.multiple_id] = angular.copy(widgetSettings);
    };
}
