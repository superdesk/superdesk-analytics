import {formatDate, getNameFromQcode} from '../../utils';

ContentPublishingReports.$inject = [
    'lodash',
    'moment',
    'config',
    '$interpolate',
    'gettext',
    'gettextCatalog',
    'metadata',
    'chartConfig',
];

/**
 * @ngdoc service
 * @module superdesk.apps.analytics.content-publishing-report
 * @name ContentPublishingReports
 * @requires _
 * @requires moment
 * @requires config
 * @requires $interpolate
 * @requires gettext
 * @requires gettextCatalog
 * @requires metadata
 * @requires chartConfig
 * @description Content Publishing service to generate Highcharts config
 */
export function ContentPublishingReports(
    _,
    moment,
    config,
    $interpolate,
    gettext,
    gettextCatalog,
    metadata,
    chartConfig
) {
    const cv = {
        categories: [],
        genre: [],
        urgency: [],
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReports#getFieldTitle
     * @param {String} field - The name of the field (i.e. anpa_category.qcode)
     * @return {String}
     * @description Returns the human readable name for the provided field
     */
    this.getFieldTitle = (field) => {
        switch (field) {
        case 'anpa_category.qcode':
            return gettext('Category');
        case 'genre.qcode':
            return gettext('Genre');
        case 'source':
            return gettext('Source');
        case 'urgency':
            return gettextCatalog.getString('Urgency');
        default:
            return '';
        }
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReports#generateTitle
     * @param {Object} report - Report parameters
     * @return {String}
     * @description Returns the title to use for the Highcharts config
     */
    this.generateTitle = (report) => {
        if (_.get(report, 'chart.title')) {
            return report.chart.title;
        }

        const parentField = _.get(report, 'aggs.group.field');
        const parentName = this.getFieldTitle(parentField);

        if (_.get(report, 'aggs.subgroup.field.length', 0) > 0) {
            const childField = _.get(report, 'aggs.subgroup.field');
            const childName = this.getFieldTitle(childField);

            return $interpolate(
                gettextCatalog.getString(
                    'Published Stories per {{ group }} with {{ subgroup }} breakdown'
                )
            )({group: parentName, subgroup: childName});
        }

        return $interpolate(
            gettextCatalog.getString(
                'Published Stories per {{ group }}'
            )
        )({group: parentName});
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReports#generateSubtitle
     * @param {Object} report - Report parameters
     * @return {String}
     * @description Returns the subtitle to use for the Highcharts config based on the date parameters
     */
    this.generateSubtitle = (report) => {
        if (_.get(report, 'chart.subtitle')) {
            return report.chart.subtitle;
        }

        const dateFilter = _.get(report, 'date_filter') || _.get(report, 'dates.filter');

        if (dateFilter === 'range') {
            const start = _.get(report, 'start_date') || _.get(report, 'dates.start');
            const end = _.get(report, 'end_date') || _.get(report, 'dates.end');

            if (moment(start, config.model.dateformat).isValid() &&
                moment(end, config.model.dateformat).isValid()
            ) {
                return formatDate(moment, config, start) +
                    ' - ' +
                    formatDate(moment, config, end);
            }
        } else if (dateFilter === 'yesterday') {
            return moment()
                .subtract(1, 'days')
                .format('dddd Do MMMM YYYY');
        } else if (dateFilter === 'last_week') {
            const startDate = moment()
                .subtract(1, 'weeks')
                .startOf('week')
                .format('LL');
            const endDate = moment()
                .subtract(1, 'weeks')
                .endOf('week')
                .format('LL');

            return startDate + ' - ' + endDate;
        } else if (dateFilter === 'last_month') {
            return moment()
                .subtract(1, 'months')
                .format('MMMM YYYY');
        }

        return null;
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReports#getSourceTitles
     * @param {String} field - The field name of the source (i.e. anpa_category.qcode)
     * @param {Array<String>} keys - Array of source keys
     * @return {Array<String>}
     * @description Generates the name of the source names from qcodes
     */
    this.getSourceTitles = (field, keys) => {
        switch (field) {
        case 'anpa_category.qcode':
            return keys.map((qcode) => getNameFromQcode(
                cv.categories,
                qcode
            ));
        case 'genre.qcode':
            return keys.map((qcode) => getNameFromQcode(
                cv.genre,
                qcode
            ));
        case 'source':
            return keys;
        case 'urgency':
            return keys.map((qcode) => getNameFromQcode(
                cv.urgency,
                qcode
            ));
        default:
            return keys;
        }
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReports#getSourceTitle
     * @param {String} field - The field name of the source (i.e. anpa_category.qcode)
     * @param {String} qcode - The qcode/value of the data source
     * @return {String}
     * @description Returns the name of the specific data source using CV and qcode data
     */
    this.getSourceTitle = (field, qcode) => {
        switch (field) {
        case 'anpa_category.qcode':
            return getNameFromQcode(
                cv.categories,
                qcode
            );
        case 'genre.qcode':
            return getNameFromQcode(
                cv.genre,
                qcode
            );
        case 'source':
            return qcode;
        case 'urgency':
            return getNameFromQcode(
                cv.urgency,
                qcode
            );
        default:
            return '';
        }
    };

    /**
     * @ngdoc method
     * @name loadVCData
     * @description Loads the CV data for use when generating the Highcharts config
     */
    const loadVCData = () => {
        cv.categories = _.keyBy(
            _.get(metadata, 'values.categories') || [],
            (item) => (_.get(item, 'qcode') || '').toString()
        );
        cv.genre = _.keyBy(
            _.get(metadata, 'values.genre') || [],
            (item) => (_.get(item, 'qcode') || '').toString()
        );
        cv.urgency = _.keyBy(
            _.get(metadata, 'values.urgency') || [],
            (item) => (_.get(item, 'qcode') || '').toString()
        );
    };

    /**
     * @ngdoc method
     * @name ContentPublishingReports#createChart
     * @param {Object} report - Report parameters
     * @return {Object}
     * @description Generates and returns the Highcharts config based on the report parameters and data
     */
    this.createChart = (report) => (
        metadata.initialize()
            .then(() => {
                loadVCData();

                const chart = chartConfig.newConfig('chart', report.chart.type);

                chart.addSource(
                    _.get(report, 'aggs.group.field'),
                    report.groups
                );

                if (_.get(report, 'subgroups')) {
                    chart.addSource(
                        _.get(report, 'aggs.subgroup.field'),
                        report.subgroups
                    );
                }

                chart.getTitle = () => this.generateTitle(report);
                chart.getSubtitle = () => this.generateSubtitle(report);
                chart.getSourceName = this.getFieldTitle;
                chart.getSourceTitles = this.getSourceTitles;
                chart.getSourceTitle = this.getSourceTitle;
                chart.sortOrder = _.get(report, 'chart.sort_order') || 'desc';

                return chart;
            })
    );
}
