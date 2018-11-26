
/**
 * @ngdoc method
 * @name Analytics#formatDateForServer
 * @param {Object} moment
 * @param {Object} config
 * @param {String} date
 * @param {Number} addDays
 * @returns {String}|null
 * @description Format given date for use with API calls
*/
export function formatDateForServer(moment, config, date, addDays = 0) {
    if (date) {
        const timeSuffix = addDays ? 'T23:59:59' : 'T00:00:00';
        let local = moment(date, config.model.dateformat).format('YYYY-MM-DD') + timeSuffix;

        if (config.search && config.search.useDefaultTimezone) {
            // use the default timezone of the server
            local += moment.tz(config.defaultTimezone).format('ZZ');
        } else {
            local += moment().format('ZZ');
        }

        return local;
    }

    return null;
}

/**
 * @ngdoc method
 * @name Analytics#formatDate
 * @param {Function} moment
 * @param {Object} config
 * @param {String} dateTime
 * @param {String} format
 * @returns {String}
 * @description Format the date/time based on the supplied format
 */
export function formatDate(moment, config, dateTime, format = 'LL') {
    return moment(dateTime, config.model.dateformat).format(format);
}

/**
 * @ngdoc method
 * @name Analytics#getErrorMessage
 * @param {Object|String} error - The API response, containing the error message
 * @param {String} defaultMessage - The default string to return
 * @returns {String} string containing the error message
 * @description Utility to return the error message from a api response, or the default message supplied
 */
export const getErrorMessage = (error, defaultMessage) => {
    if (error) {
        if (typeof error === 'string') {
            return error;
        } else if (error.data) {
            if (error.data._message) {
                return error.data._message;
            } else if (error.data._issues && error.data._issues['validator exception']) {
                return error.data._issues['validator exception'];
            } else if (error.data._error && error.data._error.message) {
                return error.data._error.message;
            }
        }
    }

    return defaultMessage;
};

/**
 * @ngdoc method
 * @name Analytics#getUtcOffsetInMinutes
 * @param {moment} utcDatetime The moment date/time instance used to calculate utc offset
 * @param {String} timezone - The timezone name
 * @param {Function} moment - The moment js module
 * @return {Number}
 * @description Calculates the UTC Offset in minutes for the supplied datetime instance
 */
export const getUtcOffsetInMinutes = (utcDatetime, timezone, moment) => (
    moment(utcDatetime)
        .tz(timezone)
        .utcOffset()
);
