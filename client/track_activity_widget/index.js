/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as ctrl from './controllers';


function cacheIncludedTemplates($templateCache) {
    $templateCache.put('track-activity-widget-settings.html', require('./views/track_activity_widget_settings.html'));
    $templateCache.put('track-activity-widget.html', require('./views/track_activity_widget.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics.track-activity-widget
 * @name superdesk.analytics.track-activity-widget
 * @packageName analytics.track-activity-widget
 * @description Superdesk track activity widget.
 */
export default angular.module('superdesk.analytics.track-activity-widget', [
    'superdesk.apps.dashboard.widgets',
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace',
    'superdesk.analytics.track-activity-report'
])

    .run(cacheIncludedTemplates)
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('track-activity-report', {
            label: gettext('Track Activity Report'),
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 2,
            sizex: 1,
            sizey: 2,
            thumbnail: require('./thumbnail.svg'),
            template: 'track-activity-widget.html',
            configurationTemplate: 'track-activity-widget-settings.html',
            description: 'This wiget allows you to view the track activity reports',
            custom: true
        });
    }])

    .controller('TrackActivityWidgetController', ctrl.TrackActivityWidgetController)
    .controller('TrackActivityWidgetSettingsController', ctrl.TrackActivityWidgetSettingsController);
