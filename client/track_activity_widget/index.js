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
import * as directive from './directives';


function cacheIncludedTemplates($templateCache) {
    $templateCache.put('track_activity_widget_configuration.html', require('./views/configuration.html'));
    $templateCache.put('track_activity_widget.html', require('./views/track_activity_widget.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics.track_activity_widget
 * @name superdesk.analytics.track_activity_widget
 * @packageName analytics.track_activity_widget
 * @description Superdesk track activity widget.
 */
export default angular.module('superdesk.analytics.track_activity_widget', [
        'superdesk.apps.aggregate',
        'superdesk.apps.dashboard.widgets',
        'superdesk.apps.authoring.widgets',
        'superdesk.apps.desks',
        'superdesk.apps.workspace'
    ])

    .run(cacheIncludedTemplates)
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('track_activity_widget', {
            label: gettext('Track Activity Widget'),
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 3,
            sizex: 1,
            sizey: 2,
            thumbnail: require('./thumbnail.svg'),
            template: 'track_activity_widget.html',
            configurationTemplate: 'track_activity_widget_configuration.html',
            description: 'This wiget allows you to view the track activity reports',
            custom: true
        });
    }])
    .controller('TrackActivityWidgetController', ctrl.TrackActivityWidgetController)
    .directive('sdTrackActivityWidgetSettings', directive.TrackActivityWidgetSettings);
