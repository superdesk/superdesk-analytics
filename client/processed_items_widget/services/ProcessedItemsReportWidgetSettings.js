ProcessedItemsReportWidgetSettings.$inject = ['workspaces'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.processed-items-widget
 * @name ProcessedItemsReportWidgetSettings
 * @requires workspaces
 * @description A service that manages the processed items report widget settings
 */
export function ProcessedItemsReportWidgetSettings(workspaces) {
    this.widgetsSettings = {};

    var self = this;

    /**
     * @ngdoc method
     * @name ProcessedItemsReportWidgetSettings#getSettings
     * @param {Integer} widgetMultipleId
     * @returns {Object}
     * @description Reads widget settings
     */
    this.getSettings = function(widgetMultipleId) {
        return self.widgetsSettings[widgetMultipleId];
    };

    /**
     * @ngdoc method
     * @name ProcessedItemsReportWidgetSettings#saveSettings
     * @param {Object} widgetSettings
     * @description Save widget settings
     */
    this.saveSettings = function(widgetSettings) {
        self.widgetsSettings[widgetSettings.multiple_id] = angular.copy(widgetSettings);
    };
}
