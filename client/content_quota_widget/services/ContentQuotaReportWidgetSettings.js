ContentQuotaReportWidgetSettings.$inject = ['workspaces'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.content-quota-widget
 * @name ContentQuotaReportWidgetSettings
 * @requires workspaces
 * @description A service that manages the content quota report widget settings
 */
export function ContentQuotaReportWidgetSettings(workspaces) {
    this.widgetsSettings = {};

    var self = this;

    /**
     * @ngdoc method
     * @name ContentQuotaReportWidgetSettings#getSettings
     * @param {Integer} widgetMultipleId
     * @returns {Object}
     * @description Reads widget settings
     */
    this.getSettings = function(widgetMultipleId) {
        return self.widgetsSettings[widgetMultipleId];
    };

    /**
     * @ngdoc method
     * @name ContentQuotaReportWidgetSettings#saveSettings
     * @param {Object} widgetSettings
     * @description Save widget settings
     */
    this.saveSettings = function(widgetSettings) {
        self.widgetsSettings[widgetSettings.multiple_id] = angular.copy(widgetSettings);
    };
}
