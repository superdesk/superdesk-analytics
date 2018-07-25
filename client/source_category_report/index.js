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
import * as ctrl from './controllers';

function cacheIncludedTemplates($templateCache) {
    $templateCache.put(
        'source-category-report-panel.html',
        require('./views/source-category-report-panel.html')
    );
    $templateCache.put(
        'source-category-report-parameters.html',
        require('./views/source-category-report-parameters.html')
    );
    $templateCache.put(
        'source-category-report-filters.html',
        require('./views/source-category-report-filters.html')
    );
    $templateCache.put(
        'source-category-report-chart-options.html',
        require('./views/source-category-report-chart-options.html')
    );
}
cacheIncludedTemplates.$inject = ['$templateCache'];

/**
 * @ngdoc module
 * @module superdesk.analytics.source-category-report
 * @name superdesk.analytics.source-category-report
 * @packageName analytics.source-category-report
 * @description Superdesk analytics generate report of stories per category with source breakdown.
 */
angular.module('superdesk.analytics.source-category-report', [])
    .service('sourceCategoryChart', svc.SourceCategoryChart)

    .controller('SourceCategoryController', ctrl.SourceCategoryController)

    .run(cacheIncludedTemplates)

    .config(['reportsProvider', 'gettext', function(reportsProvider, gettext) {
        reportsProvider.addReport({
            id: 'source_category_report',
            label: gettext('Source Category'),
            sidePanelTemplate: 'source-category-report-panel.html',
            controller: ctrl.SourceCategoryController,
            priority: 500,
            privileges: {source_category_report: 1},
        });
    }]);
