import {gettext} from '../../utils';

ChartManager.$inject = ['lodash', 'Highcharts', 'notify'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name ChartManager
 * @requires lodash
 * @requires notify
 * @description Highchart instance manager
 */
export function ChartManager(_, Highcharts, notify) {
    this.charts = null;
    this.defaultConfig = null;

    /**
     * @ngdoc method
     * @name ChartManager#init
     * @description Sets up the dictionary of chart instances
     */
    const init = () => {
        Highcharts.setOptions({lang: {thousandsSep: ','}});
        this.charts = {};
        this.defaultConfig = {
            credits: {enabled: false},
            exporting: {
                fallbackToExportServer: false,
                error: () => {
                    notify.error(gettext('Failed to export the chart;'));
                },
                buttons: {
                    contextButton: {
                        menuItems: [
                            'printChart',
                            'downloadPNG',
                            'downloadJPEG',
                            'downloadSVG',
                            'downloadPDF',
                            'downloadCSV',
                        ],
                    },
                },
            },
        };
    };

    /**
     * @ngdoc method
     * @name ChartManager#create
     * @param {HTMLDOMElement} target - The target element to render to
     * @param {Object} config - Highcharts chart config
     * @param {String} id - The ID associated with this chart instance
     * @return {Object}
     * @description Creates a Highcharts instance, destroying the previous instance if exists
     */
    this.create = function(target, config, id) {
        this.destroy(id);
        this.charts[id] = Highcharts.chart(
            target,
            Object.assign({}, this.defaultConfig, config)
        );
        return this.charts[id];
    };

    /**
     * @ngdoc method
     * @name ChartManager#destroy
     * @param {String} id - The ID associated with the chart instance
     * @description Destroys the Highcharts instance
     */
    this.destroy = function(id) {
        if (_.get(this.charts, `${id}.destroy`)) {
            this.charts[id].destroy();
        }

        delete this.charts[id];
    };

    /**
     * @ngdoc method
     * @name ChartManager#reflow
     * @param {String} id - The ID associated with the chart instance
     * @description Performs a reflow on the Highcharts instance
     */
    this.reflow = function(id) {
        if (_.get(this.charts, `${id}.reflow`)) {
            this.charts[id].reflow();
        }
    };

    /**
     * @ngdoc method
     * @name ChartManager@export
     * @param {String} id - The ID associated with the chart instance
     * @param {Object} options - The Highcharts export options
     * @description Performs a manual export on the Highcharts instance
     */
    this.export = function(id, options) {
        if (_.get(this.charts, `${id}.exportChart`)) {
            this.charts[id].exportChartLocal(options);
        }
    };

    /**
     * @ngdoc method
     * @name ChartManager#downloadCSV
     * @param {Object} config - The chart config object, containing the ID of the ID associated with the chart instance
     * @description Converts the chart data to a CSV string, then downloads as a CSV file
     */
    this.downloadCSV = function(config) {
        const id = config.id;
        const filename = `${id}.csv`;

        if (_.get(this.charts, `${id}.getCSV`)) {
            // Either use a custom defined genCSV or the one from Highcharts
            const csv = config.genCSV ?
                config.genCSV() :
                this.charts[id].getCSV();
            const link = document.createElement('a');

            link.setAttribute('href', 'data:text/text;charset=utf-8,' + encodeURIComponent(csv));
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    init();
}
