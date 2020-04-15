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
import * as directives from './directives';

/**
 * @ngdoc module
 * @module superdesk.analytics.search
 * @name superdesk.analytics.search
 * @packageName analytics.search
 * @description Analytics Report Search
 */
angular.module('superdesk.analytics.search', [])
    .service('searchReport', svc.SearchReport)

    .directive('sdaSourceFilters', directives.SourceFilters) // !!! used in superdesk-aap project
    .directive('sdaDateFilters', directives.DateFilters)

    .directive('sdaPreviewDateFilter', directives.PreviewDateFilter)
    .directive('sdaPreviewSourceFilter', directives.PreviewSourceFilter)

    .directive('sdaUserSelect', directives.UserSelect);
