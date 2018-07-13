/**
 * This file is part of Superdesk.
 *
 * Copyright 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import * as svc from './services';
import * as directive from './directives';


/**
 * @ngdoc module
 * @module superdesk.analytics.source-category-report
 * @name superdesk.analytics.source-category-report
 * @packageName analytics.source-category-report
 * @description Superdesk analytics generate report of stories per category with source breakdown.
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
            priority: -800,
        });
    }]);
