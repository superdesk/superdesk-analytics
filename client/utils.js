
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
 * @param {Object} moment
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
 * @name Analytics#generateSubtitle
 * @param {Object} moment
 * @param {Object} config
 * @param {Object} report
 * @returns {String}
 * @description Returns a subtitle for a chart based on the supplied date filter and start/end dates
 */
export function generateSubtitle(moment, config, report) {
    if (report.dateFilter === 'range') {
        if (moment(report.start_date, config.model.dateformat).isValid() &&
            moment(report.end_date, config.model.dateformat).isValid()
        ) {
            return formatDate(moment, config, report.start_date) + ' - ' + formatDate(moment, config, report.end_date);
        }

        return '';
    } else if (report.dateFilter === 'yesterday') {
        return moment()
            .subtract(1, 'days')
            .format('dddd Do MMMM YYYY');
    } else if (report.dateFilter === 'last_week') {
        const startDate = moment()
            .subtract(1, 'weeks')
            .startOf('week')
            .format('LL');
        const endDate = moment()
            .subtract(1, 'weeks')
            .endOf('week')
            .format('LL');

        return startDate + ' - ' + endDate;
    } else if (report.dateFilter === 'last_month') {
        return moment()
            .subtract(1, 'months')
            .format('MMMM YYYY');
    }

    return '';
}
