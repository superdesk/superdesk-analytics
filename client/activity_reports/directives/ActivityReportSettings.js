ActivityReportSettings.$inject = ['desks', 'metadata'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.activity-report
 * @name sdActivityReportSettings
 * @requires desks
 * @requires metadata
 * @description A directive that generates the form containing activity report parameters
 */
export function ActivityReportSettings(desks, metadata) {
    return {
        template: require('../views/activity-report-settings.html'),
        scope: {
            settings: '=',
            widget: '=',
            step: '=',
        },
        link: function(scope, element, attrs, controller) {
            desks.initialize().then(() => {
                scope.desks = desks.desks._items;
            });

            metadata.initialize().then(() => {
                scope.metadata = metadata.values;
            });
        },
    };
}
