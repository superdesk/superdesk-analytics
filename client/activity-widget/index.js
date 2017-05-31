/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as svc from './services';
import * as ctrl from './controllers';


function cacheIncludedTemplates($templateCache) {
    $templateCache.put('activity-widget-settings.html', require('./views/activity-widget-settings.html'));
    $templateCache.put('activity-widget.html', require('./views/activity-widget.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics.activity-widget
 * @name superdesk.analytics.activity-widget
 * @packageName analytics.activity-widget
 * @description Superdesk activity widget.
 */
export default angular.module('superdesk.analytics.activity-report-widget', [
    'superdesk.apps.dashboard.widgets',
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace',
    'superdesk.analytics.activity-report'
])

    .run(cacheIncludedTemplates)
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('activity-report', {
            label: gettext('Activity Report'),
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 2,
            sizex: 1,
            sizey: 2,
            classes: 'tabs modal--nested-fix',
            thumbnail: require('./thumbnail.svg'),
            template: 'activity-widget.html',
            configurationTemplate: 'activity-widget-settings.html',
            description: 'This wiget allows you to view the activity report',
            custom: true
        });
    }])

    .service('activityReportWidgetSettings', svc.ActivityReportWidgetSettings)

    .controller('ActivityReportWidgetController', ctrl.ActivityReportWidgetController)
    .controller('ActivityWidgetSettingsController', ctrl.ActivityWidgetSettingsController);
