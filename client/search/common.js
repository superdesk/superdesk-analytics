/**
 * @ngdoc property
 * @module superdesk.analytics.search
 * @name DATE_FILTERS
 * @type {Object}
 * @description Available date filters
 */
export const DATE_FILTERS = {
    // ABSOLUTE
    RANGE: 'range',
    DAY: 'day',

    // HOURS
    RELATIVE_HOURS: 'relative_hours',

    // DAYS
    RELATIVE_DAYS: 'relative_days',
    YESTERDAY: 'yesterday',
    TODAY: 'today',

    // WEEKS
    RELATIVE_WEEKS: 'relative_weeks',
    LAST_WEEK: 'last_week',
    THIS_WEEK: 'this_week',

    // MONTHS
    RELATIVE_MONTHS: 'relative_months',
    LAST_MONTH: 'last_month',
    THIS_MONTH: 'this_month',

    // YEARS
    LAST_YEAR: 'last_year',
    THIS_YEAR: 'this_year',
};
