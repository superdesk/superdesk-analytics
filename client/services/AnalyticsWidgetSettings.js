AnalyticsWidgetSettings.$inject = ['workspaces', 'preferencesService'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name AnalyticsWidgetSettings
 * @requires workspaces
 * @requires preferencesService
 * @description A service that handles the retrieval of the track activity widget settings
 */
export function AnalyticsWidgetSettings(workspaces, preferencesService) {
    var PREFERENCES_KEY = 'agg:view';

    /**
     * @ngdoc method
     * @name AnalyticsWidgetSettings#readSettings
     * @param {String} widgetType
     * @description Reads widget settings
     */
    this.readSettings = function(widgetType) {
        return workspaces.getActiveId()
        .then((activeWorkspace) => preferencesService.get(PREFERENCES_KEY)
            .then((preferences) => {
                if (preferences[activeWorkspace.id] && preferences[activeWorkspace.id][widgetType]) {
                    return preferences[activeWorkspace.id][widgetType];
                }
            }));
    };

    /**
     * @ngdoc method
     * @name AnalyticsWidgetSettings#saveSettings
     * @param {String} widgetType
     * @param {Object} settings
     * @description Save widget settings
     */
    this.saveSettings = function(widgetType, settings) {
        return workspaces.getActiveId()
        .then((activeWorkspace) => preferencesService.get(PREFERENCES_KEY)
            .then((preferences) => {
                var updates = {[PREFERENCES_KEY]: {[activeWorkspace.id]: {[widgetType]: settings}}};

                return preferencesService.update(updates, PREFERENCES_KEY);
            })
        );
    };
}
