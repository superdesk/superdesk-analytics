/**
 * This file is part of Superdesk.
 *
 * Copyright 2018 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

import './styles/charts.scss';
import * as svc from './services';
import * as directive from './directives';

var Highcharts = require('highcharts/js/highcharts');

require('highcharts/js/modules/exporting')(Highcharts);
require('highcharts/js/modules/data')(Highcharts);
require('highcharts/js/modules/export-data')(Highcharts);
require('highcharts/js/modules/offline-exporting')(Highcharts);
require('highcharts/js/modules/no-data-to-display')(Highcharts);

/**
 * @ngdoc module
 * @module superdesk.analytics.charts
 * @name superdesk.analytics.charts
 * @packageName analytics.charts
 * @description Highcharts charts
 */
angular.module('superdesk.analytics.charts', [])
    .value('Highcharts', Highcharts)

    .service('chartManager', svc.ChartManager)

    .directive('sdChart', directive.Chart)
    .directive('sdChartContainer', directive.ChartContainer);
