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
    $templateCache.put('processed_items_widget_settings.html', require('./views/processed_items_widget_settings.html'));
    $templateCache.put('processed_items_widget.html', require('./views/processed_items_widget.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics.track_activity_widget
 * @name superdesk.analytics.track_activity_widget
 * @packageName analytics.track_activity_widget
 * @description Superdesk track activity widget.
 */
export default angular.module('superdesk.analytics.processed-items-widget', [
    'superdesk.apps.dashboard.widgets',
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace',
    'superdesk.analytics.processed-items-report'
])

    .run(cacheIncludedTemplates)
    .config(['dashboardWidgetsProvider', function(dashboardWidgets) {
        dashboardWidgets.addWidget('processed_items_widget', {
            label: gettext('Processed Items'),
            multiple: true,
            icon: 'archive',
            max_sizex: 2,
            max_sizey: 2,
            sizex: 1,
            sizey: 2,
            thumbnail: require('./thumbnail.svg'),
            template: 'processed_items_widget.html',
            configurationTemplate: 'processed_items_widget_settings.html',
            description: 'This wiget allows you to view the processed items reports',
            custom: true
        });
    }])

    .service('processedItemsReportWidgetSettings', svc.ProcessedItemsReportWidgetSettings)

    .controller('ProcessedItemsWidgetController', ctrl.ProcessedItemsWidgetController)
    .controller('ProcessedItemsWidgetSettingsController', ctrl.ProcessedItemsWidgetSettingsController);
