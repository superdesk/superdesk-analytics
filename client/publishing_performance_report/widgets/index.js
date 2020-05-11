/**
 * This file is part of Superdesk.
 *
 * Copyright 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import {gettext} from 'superdesk-core/scripts/core/utils';

import {PublishingActionsWidgetController} from './publishing_actions/controller';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'publishing-actions-widget.html',
        require('./publishing_actions/widget.html')
    );
    $templateCache.put(
        'publishing-actions-widget-settings.html',
        require('./publishing_actions/settings.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.publishing-performance-report.widgets
 * @name superdesk.analytics.publishing-performance-report.widgets
 * @packageName analytics.publishing-performance-report.widgets
 * @description Superdesk analytics generate report of Publishing Performance statistics.
 */
angular.module('superdesk.analytics.publishing-performance-report.widgets', [
    'superdesk.apps.dashboard.widgets',
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace',
    'superdesk.analytics.charts',
])
    .controller('PublishingActionsWidgetController', PublishingActionsWidgetController)

    .run(cacheIncludedTemplates)

    .config(['dashboardWidgetsProvider', function(dashboardWidgetsProvider) {
        dashboardWidgetsProvider.addWidget('publishing-actions', {
            label: gettext('Publishing Actions'),
            description: gettext('Publishing Actions Widget'),
            multiple: true,
            icon: 'signal',
            max_sizex: 1,
            max_sizey: 1,
            sizex: 1,
            sizey: 1,
            thumbnail: 'scripts/apps/ingest/ingest-stats-widget/thumbnail.svg',
            template: 'publishing-actions-widget.html',
            configurationTemplate: 'publishing-actions-widget-settings.html',
            custom: true,
            removeHeader: true,
        });
    }]);
