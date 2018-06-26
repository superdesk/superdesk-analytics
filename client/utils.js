
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
        var timestamp = moment(date, config.model.dateformat, true);

        if (!timestamp.isValid()) {
            timestamp = moment(date);
        }

        timestamp = moment(timestamp)
            .subtract(moment().utcOffset(), 'minutes');

        if (addDays) {
            timestamp.add(addDays, 'days').subtract(1, 'seconds');
        }

        return timestamp.format('YYYY-MM-DDTHH:mm:ss');
    }

    return null;
}
