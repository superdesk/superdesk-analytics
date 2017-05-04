AnalyticsWidgetSettings.$inject = ['workspaces'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name AnalyticsWidgetSettings
 * @requires workspaces
 * @description A service that handles the retrieval of the track activity widget settings
 */
export function AnalyticsWidgetSettings(workspaces) {
    /**
     * @ngdoc method
     * @name AnalyticsWidgetSettings#getSettings
     * @param {Integer} widgetId
     * @param {Integer} widgetMultipleId
     * @returns {Promise}
     * @description Reads widget settings
     */
    this.getSettings = function(widgetId, widgetMultipleId) {
        return workspaces.getActive()
        .then((workspace) => {
            var settings = null;

            _.each(workspace.widgets, (widget) => {
                if (widgetId === widget._id &&
                        (typeof widgetMultipleId !== 'number' || widgetMultipleId === widget.multiple_id)) {
                    settings = angular.copy(widget);
                }
                return settings;
            });
            return settings;
        });
    };

    /**
     * @ngdoc method
     * @name AnalyticsWidgetSettings#saveSettings
     * @param {Object} modifiedWidget
     * @returns {Promise}
     * @description Save widget settings
     */
    this.saveSettings = function(modifiedWidget) {
        return workspaces.getActive()
        .then((workspace) => {
            var widgets = angular.copy(workspace.widgets);

            _.each(widgets, (widget) => {
                if (modifiedWidget._id === widget._id && modifiedWidget.multiple_id === widget.multiple_id) {
                    widget.configuration = modifiedWidget.configuration;
                }
            });
            return workspaces.save(workspace, {widgets: widgets});
        });
    };
}
