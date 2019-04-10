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
import * as svc from './services';
import * as directive from './directives';

// Base services/directives
import './charts';
import './search';
import './saved_reports';
import './scheduled_reports';
import './email_report';

// Reports
import './content_publishing_report';
import './publishing_performance_report';
import './planning_usage_report';
import './desk_activity_report';
import './production_time_report';
import './user_activity_report';
import './featuremedia_updates_report';
import './update_time_report';

angular.module('superdesk.analytics.reports', ['superdesk.core.features'])
    .provider('reports', svc.ReportsProvider);

function cacheIncludedTemplates($templateCache) {
    $templateCache.put('analytics-report-basic.html', require('./views/analytics-report-basic.html'));
}
cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics
 * @name superdesk.analytics
 * @packageName analytics
 * @description Superdesk analytics module.
 */
export default angular.module('superdesk.analytics', [
    // Base services/directives
    'superdesk.analytics.charts',
    'superdesk.analytics.search',
    'superdesk.analytics.saved_reports',
    'superdesk.analytics.scheduled_reports',
    'superdesk.analytics.reports',
    'superdesk.analytics.email_report',
    'superdesk-ui',

    // Reports
    'superdesk.analytics.content-publishing-report',
    'superdesk.analytics.publishing-performance-report',
    'superdesk.analytics.planning-usage-report',
    'superdesk.analytics.desk-activity-report',
    'superdesk.analytics.production-time-report',
    'superdesk.analytics.user-activity-report',
    'superdesk.analytics.featuremedia-updates-report',
    'superdesk.analytics.update-time-report',
])
    .directive('sdaAnalyticsContainer', directive.AnalyticsContainer)
    .directive('sdaReportDropdown', directive.ReportDropdown)
    .directive('sdaConvertToNumber', directive.ConvertToNumber)
    .directive('sdaArchivePreviewProxy', directive.ArchivePreviewProxy)
    .directive('sdaRenditionsPreview', directive.RenditionsPreview)

    .service('reportConfigs', svc.ReportConfigService)

    .run(cacheIncludedTemplates)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/analytics', {
            label: gettext('Analytics'),
            description: gettext('View analytics reports'),
            when: '/analytics',
            template: require('./views/analytics.html'),
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            category: superdesk.MENU_MAIN,
            priority: 100,
            adminTools: false,
            filters: [],
        });
    }]);
