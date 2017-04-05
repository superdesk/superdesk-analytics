/**
 * This file is part of Superdesk.
 *
 * Copyright 2016 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import './styles/analytics.scss';
import * as ctrl from './controllers';
import * as directive from './analytics-widget/directives';

import './activity_reports';
import './processed_items_report';
import './track_activity_report';
import './analytics-widget';


function cacheIncludedTemplates($templateCache) {
    $templateCache.put('activity-report.html', require('./activity_reports/views/activity-report.html'));
    $templateCache.put('processed-items-report.html',
        require('./processed_items_report/views/processed-items-report.html'));
    $templateCache.put('track-activity-report.html',
        require('./track_activity_report/views/track-activity-report.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics
 * @name superdesk.analytics
 * @packageName analytics
 * @description Superdesk analytics module.
 */
export default angular.module('superdesk.analytics',
    ['superdesk.analytics.activity-report', 'superdesk.analytics.processed-items-report',
        'superdesk.analytics.track-activity-report', 'superdesk.analytics.analytics-widget'])
    .controller('AnalyticsController', ctrl.AnalyticsController)

    .run(cacheIncludedTemplates)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('analytics', {
            label: gettext('Analytics'),
            when: '/analytics',
            controller: 'AnalyticsController',
            template: require('./views/analytics.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            category: 'analytics',
            priority: -800
        });
    }])

angular.module('superdesk.apps.analytics', [
    'superdesk.apps.authoring.widgets',
    'superdesk.apps.desks',
    'superdesk.apps.workspace'
])
    .controller('AggregateCtrl', ctrl.AggregateCtrl)
    .directive('sdAnalyticsSettings', directive.AnalyticsSettings)
    .directive('sdWidgetGroup', directive.WidgetGroup);