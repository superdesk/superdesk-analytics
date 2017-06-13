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
    $templateCache.put('content-quota-widget-settings.html', require('./views/content_quota_widget_settings.html'));
    $templateCache.put('content-quota-widget.html', require('./views/content_quota_widget.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics.content-quota-widget
 * @name superdesk.analytics.content-quota-widget
 * @packageName analytics.content-quota-widget
 * @description Superdesk content quota widget.
 */
export default angular.module('superdesk.analytics.content-quota-widget', [
    'superdesk.apps.dashboard.widgets',
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace',
    'superdesk.analytics.content-quota-report'
])

    .run(cacheIncludedTemplates)
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('content-quota-report', {
            label: gettext('Content Quota Report'),
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 2,
            sizex: 1,
            sizey: 2,
            thumbnail: require('./thumbnail.svg'),
            template: 'content-quota-widget.html',
            configurationTemplate: 'content-quota-widget-settings.html',
            description: 'This wiget allows you to view the content vs quota reports',
            custom: true
        });
    }])

    .service('contentQuotaReportWidgetSettings', svc.ContentQuotaReportWidgetSettings)

    .controller('ContentQuotaWidgetController', ctrl.ContentQuotaWidgetController)
    .controller('ContentQuotaWidgetSettingsController', ctrl.ContentQuotaWidgetSettingsController);
