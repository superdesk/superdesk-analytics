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
import * as directive from './directives';


/**
 * @ngdoc module
 * @module superdesk.analytics.track-activity-report
 * @name superdesk.analytics.track-activity-report
 * @packageName analytics.track-activity-report
 * @description Superdesk analytics track activity report.
 */
angular.module('superdesk.analytics.source-category-report', [])
    .service('sourceCategoryChart', svc.SourceCategoryChart)
    .service('sourceCategoryReport', svc.SourceCategoryReport)

    .directive('sdSourceCategoryReportContainer', directive.SourceCategoryReportContainer)
    .directive('sdSourceCategoryReportPanel', directive.SourceCategoryReportPanel)
    .directive('sdSourceCategoryReportView', directive.SourceCategoryReportView)

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('source-category-report', {
            label: gettext('Source Category Report'),
            template: require('./views/source-category-report.html'),
            topTemplateUrl: 'scripts/apps/dashboard/views/workspace-topnav.html',
            sideTemplateUrl: 'scripts/apps/workspace/views/workspace-sidenav.html',
            category: 'analytics',
            priority: -800
        });
    }]);
