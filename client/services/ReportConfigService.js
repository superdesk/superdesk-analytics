ReportConfigService.$inject = ['api', '$q', 'lodash'];

/**
 * @ngdoc property
 * @name superdesk.apps.analytics#REPORT_CONFIG
 * @type {Object}
 * @description Available report config attributes
 */
export const REPORT_CONFIG = {
    DATE_FILTERS: 'date_filters',
    CHART_TYPES: 'chart_types',
    DEFAULT_PARAMS: 'default_params',
};

/**
 * @ngdoc service
 * @module superdesk.apps.analytics
 * @name api
 * @name $q
 * @name lodash
 * @description Report Config service
 */
export function ReportConfigService(api, $q, _) {
    /**
     * @ngdoc method
     * @name ReportConfigService#init
     * @description Initialise the service config
     */
    const init = () => {
        this.configs = {};
    };

    /**
     * @ngdoc method
     * @name ReportConfigService#loadAll
     * @return {Promise<Object>}
     * @description Loads and returns the configs for all reports registerd on the system
     */
    this.loadAll = () => (
        api.getAll('report_configs')
            .then((data) => {
                this.configs = _.keyBy(data, '_id');

                return $q.when(this.configs);
            })
    );

    /**
     * @ngdoc method
     * @name ReportConfigService#getConfig
     * @param {String} reportId - The id of the report
     * @param {Function} extraConditions - Callback to add extra enabled conditions to fields
     * @return {Object} Report config with extra utility functions
     * @description Gets the config for the report from the cache, and adds extra utility functions
     */
    this.getConfig = (reportId, extraConditions = null) => {
        const config = _.cloneDeep(this.configs[reportId]);

        /**
         * @ngdoc method
         * @name ReportConfigService#config.filterEnabled
         * @param {String} field - The name of the field
         * @return {Object}
         * @description Returns the enabled attribute only
         */
        config.filterEnabled = (field) => {
            const attributes = _.get(config, field);

            return _.pickBy(
                attributes,
                (value, key) => (
                    _.get(value, 'enabled', true) &&
                    (!_.get(extraConditions, field) || extraConditions[field](value, key))
                )
            );
        };

        /**
         * @ngdoc method
         * @name ReportConfigService#config.get
         * @param {String} field - The name of the field
         * @param {boolean} enabledOnly - Return all or only enabled attribute
         * @return {Object}
         * @description Returns the config for the provided field
         */
        config.get = (field, enabledOnly = true) => (
            !enabledOnly ?
                _.get(config, field) :
                config.filterEnabled(field)
        );

        /**
         * @ngdoc method
         * @name ReportConfigService#config.getAttribute
         * @param {String} field - The name of the field
         * @param {String} attribute - The name of the attribute
         * @param {boolean} enabledOnly - Return only enabled or any attribute
         * @return {Object}
         * @description Returns the config for a field/attribute if it is enabled
         */
        config.getAttribute = (field, attribute, enabledOnly = true) => (
            _.get(config.get(field, enabledOnly), attribute, null)
        );

        /**
         * @ngdoc method
         * @name ReportConfigService#config.isEnabled
         * @param {String} field - The name of the field
         * @param {String} attribute - The name of the attribute
         * @return {boolean}
         * @description Returns a boolean indicating if the field/attribute is enabled
         */
        config.isEnabled = (field, attribute) => (
            config.getAttribute(field, attribute, true) !== null
        );

        /**
         * @ngdoc method
         * @name ReportConfigService#config.defaultParams
         * @param {Object} values - Supplied config to merge
         * @return {Object}
         * @description Merges the supplied config with the config from the server
         */
        config.defaultParams = (values = {}) => {
            const defaultParams = _.cloneDeep(
                config.get(REPORT_CONFIG.DEFAULT_PARAMS, false)
            );

            Object.keys(values).forEach(
                (field) => {
                    defaultParams[field] = values[field] || defaultParams[field];
                }
            );

            return defaultParams;
        };

        return config;
    };

    init();
}
