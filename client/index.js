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


function cacheIncludedTemplates($templateCache) {
    $templateCache.put('activity-report-parameters.html', 
    		require('./views/activity-report-parameters.html'));
    $templateCache.put('activity-report-grouping.html', 
    		require('./views/activity-report-grouping.html'));
    $templateCache.put('save-activity-report-dialog.html', 
    		require('./views/save-activity-report-dialog.html'));
}

cacheIncludedTemplates.$inject = ['$templateCache'];


/**
 * @ngdoc module
 * @module superdesk.analytics
 * @name superdesk.analytics 
 * @packageName analytics
 * @description Superdesk analytics specific application.
 */
export default angular.module('superdesk.analytics', [])

    .service('savedActivityReports', svc.SavedActivityReports)

    .directive('sdActivityReportContainer', directive.ActivityReportContainer)
    .directive('sdActivityReportPanel', directive.ActivityReportPanel)
    .directive('sdActivityReportView', directive.ActivityReportView)
    .directive('sdSaveActivityReport', directive.SaveActivityReport)
    .directive('sdSavedActivityReports', directive.SavedActivityReports)

    .run(cacheIncludedTemplates)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('analytics', {
            label: gettext('Analytics'),
            when: '/analytics',
            template: require('./views/analytics.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            category: 'analytics',
            priority: -800
        });
    }]);
