ChartManager.$inject = ['lodash', 'Highcharts'];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name ChartManager
 * @requires lodash
 * @description Highchart instance manager
 */
export function ChartManager(_, Highcharts) {
    this.charts = null;

    /**
     * @ngdoc method
     * @name ChartManager#init
     * @description Sets up the dictionary of chart instances
     */
    const init = () => {
        Highcharts.setOptions({lang: {thousandsSep: ','}});
        this.charts = {};
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
        this.charts[id] = Highcharts.chart(target, config);
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
     * @param {String} id - The ID assocaited with the chart instance
     * @param {String} filename - The name of the downloaded file
     * @description Converts the chart data to a CSV string, then downloads as a CSV file
     */
    this.downloadCSV = function(id, filename) {
        if (_.get(this.charts, `${id}.getCSV`)) {
            const csv = this.charts[id].getCSV();
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
