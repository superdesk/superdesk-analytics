
/**
 * @ngdoc method
 * @name analytics.utils#formatDateForServer
 * @param {Object} moment
 * @param {Object} config
 * @param {String} date
 * @param {Number} addDays
 * @returns {String|null}
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
 * @name analytics.utils#formatDate
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
 * @name analytics.utils#getErrorMessage
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
 * @name analytics.utils#getUtcOffsetInMinutes
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

/**
 * @ngdoc property
 * @name analytics.utils#ITEM_OPERATIONS
 * @type {Object}
 * @description Available item operations from stat collection
 */
export const ITEM_OPERATIONS = {
    CREATE: 'create',
    FETCH: 'fetch',
    DUPLICATED_FROM: 'duplicated_from',
    UPDATE: 'update',
    PUBLISH: 'publish',
    PUBLISH_SCHEDULED: 'publish_scheduled',
    DESCHEDULE: 'deschedule',
    PUBLISH_EMBARGO: 'publish_embargo',
    REWRITE: 'rewrite',
    CORRECT: 'correct',
    LINK: 'link',
    UNLINK: 'unlink',
    KILL: 'kill',
    TAKEDOWN: 'takedown',
    SPIKE: 'spike',
    UNSPIKE: 'unspike',
    MOVE: 'move',
    MOVE_FROM: 'move_from',
    MOVE_TO: 'move_to',
    DUPLICATE: 'duplicate',
    ITEM_LOCK: 'item_lock',
    ITEM_UNLOCK: 'item_unlock',
    MARK: 'mark',
    UNMARK: 'unmark',
    EXPORT_HIGHLIGHT: 'export_highlight',
    CREATE_HIGHLIGHT: 'create_highlight',
    ADD_FEATUREMEDIA: 'add_featuremedia',
    CHANGE_IMAGE_POI: 'change_image_poi',
    UPDATE_FEATUREMEDIA_POI: 'update_featuremedia_poi',
    REMOVE_FEATUREMEDIA: 'remove_featuremedia',
    UPDATE_FEATUREMEDIA_IMAGE: 'update_featuremedia_image',
};

/**
 * @ngdoc property
 * @name analytics.utils#ENTER_DESK_OPERATIONS
 * @type {Array<String>}
 * @description Item operations associated with content moving onto a desk
 */
export const ENTER_DESK_OPERATIONS = [
    ITEM_OPERATIONS.CREATE,
    ITEM_OPERATIONS.FETCH,
    ITEM_OPERATIONS.DUPLICATED_FROM,
    ITEM_OPERATIONS.MOVE_TO,
    ITEM_OPERATIONS.DESCHEDULE,
    ITEM_OPERATIONS.UNSPIKE,
];

/**
 * @ngdoc property
 * @name analytics.utils#EXIT_DESK_OPERATIONS
 * @type {Array<String>}
 * @description Item operations associated with content moving off a desk
 */
export const EXIT_DESK_OPERATIONS = [
    ITEM_OPERATIONS.PUBLISH,
    ITEM_OPERATIONS.SPIKE,
    ITEM_OPERATIONS.MOVE_FROM,
    ITEM_OPERATIONS.PUBLISH_SCHEDULED,
    ITEM_OPERATIONS.PUBLISH_EMBARGO,
];

/**
 * @ngdoc property
 * @name analytics#.utilsEXIT_DESK_OPERATIONS
 * @type {Array<String>}
 * @description Item operations associated with changes to featuremedia
 */
export const FEATUREMEDIA_OPERATIONS = [
    ITEM_OPERATIONS.ADD_FEATUREMEDIA,
    ITEM_OPERATIONS.CHANGE_IMAGE_POI,
    ITEM_OPERATIONS.UPDATE_FEATUREMEDIA_POI,
    ITEM_OPERATIONS.UPDATE_FEATUREMEDIA_IMAGE,
    ITEM_OPERATIONS.REMOVE_FEATUREMEDIA,
];

/**
 * @ngdoc method
 * @name analytics.utils#getTranslatedOperations
 * @param {Function} gettext
 * @return {Object}
 * @description Returns translated names for item operations
 */
export const getTranslatedOperations = (gettext) => ({
    create: gettext('Create'),
    fetch: gettext('Fetch'),
    duplicated_from: gettext('Duplicated From'),
    update: gettext('Save'),
    publish: gettext('Publish'),
    publish_scheduled: gettext('Publish Scheduled'),
    deschedule: gettext('Deschedule'),
    publish_embargo: gettext('Publish Embargo'),
    rewrite: gettext('Rewrite'),
    correct: gettext('Correct'),
    link: gettext('Link'),
    unlink: gettext('Unlink'),
    kill: gettext('Kill'),
    takedown: gettext('Takedown'),
    spike: gettext('Spike'),
    unspike: gettext('Unspike'),
    move: gettext('Move'),
    move_from: gettext('Move From'),
    move_to: gettext('Move To'),
    duplicate: gettext('Duplicate'),
    item_lock: gettext('Lock'),
    item_unlock: gettext('Unlock'),
    mark: gettext('Mark'),
    unmark: gettext('Unmark'),
    export_highlight: gettext('Export Highlight'),
    create_highlight: gettext('Create Highlight'),
    add_featuremedia: gettext('Add Featuremedia'),
    change_image_poi: gettext('Change POI'),
    update_featuremedia_poi: gettext('Change POI'),
    remove_featuremedia: gettext('Remove Featuremedia'),
    update_featuremedia_image: gettext('Change Image'),
});

/**
 * @ngdoc method
 * @name analytics.utils#secondsToHumanReadable
 * @param {Number} seconds
 * @param {Function} gettext
 * @param {Function} $interpolate
 * @return {String}
 * @description Converts seconds to a human readable format
 */
export const secondsToHumanReadable = (seconds, gettext, $interpolate) => {
    if (seconds >= 86400) {
        if (Math.floor(seconds / 86400) === 1) {
            return gettext('1 day');
        }

        return $interpolate(
            gettext('{{days}} days')
        )({days: Math.floor(seconds / 86400)});
    } else if (seconds >= 3600) {
        if (Math.floor(seconds / 3600) === 1) {
            return gettext('1 hour');
        }

        return $interpolate(
            gettext('{{hours}} hours')
        )({hours: Math.floor(seconds / 3600)});
    } else if (seconds >= 60) {
        if (Math.floor(seconds / 60) === 1) {
            return gettext('1 minute');
        }

        return $interpolate(
            gettext('{{minutes}} minutes')
        )({minutes: Math.floor(seconds / 60)});
    } else if (Math.floor(seconds) === 1) {
        return gettext('1 second');
    }

    return $interpolate(
        gettext('{{seconds}} seconds')
    )({seconds: Math.floor(seconds)});
};


/**
 * @ngdoc method
 * @module analytics.utils#compileAndGetHTML
 * @param {Function} $compile - Angular function to compile directive
 * @param {Object} scope - Scope used to generate temporary scope from
 * @param {String} template - The string to compile
 * @param {Object} data - The data to store on the new temporary scope
 * @return {String}
 * @description Compiles the provided template with a temporary scope, and returns the generated html
 */
export const compileAndGetHTML = ($compile, scope, template, data = {}) => {
    const tmpScope = scope.$new();

    Object.keys(data).forEach((key) => {
        tmpScope[key] = data[key];
    });

    let element = $compile(template)(tmpScope);

    tmpScope.$apply();
    const html = element[0].innerHTML;

    tmpScope.$destroy();

    return html;
};

/**
 * Utility to select and copy the text within a parent node
 * @param {Node} node - The parent node used to select all text from
 * @returns {string}
 */
export const getTextFromDOMNode = (node) => {
    let innerText;

    if (typeof document.selection !== 'undefined' && typeof document.body.createTextRange !== 'undefined') {
        const range = document.body.createTextRange();

        range.moveToElementText(node);
        innerText = range.text;
    } else if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
        const selection = window.getSelection();

        selection.selectAllChildren(node);
        innerText = '' + selection;
        selection.removeAllRanges();
    }
    return innerText;
};

/**
 * Utility to convert text into HTML DOM Nodes, then select and return the text shown
 * This replicates the user highlighting the text within those nodes, using the Browser
 * to do the grunt work for us.
 * @param {String|Number} data - The html in string format, i.e. '<div><p>testing</p></div>'
 * @returns {string|Number}
 */
export const convertHtmlStringToText = (data) => {
    if (typeof data !== 'string' || !data.startsWith('<')) {
        return data;
    }

    const node = document.createElement('div');
    let text;

    node.innerHTML = data;

    // Attach the node to the document before selecting
    // This is required otherwise the browser won't be able to
    // select the text
    document.body.appendChild(node);
    text = getTextFromDOMNode(node);

    // Make sure we clean up after adding the node to the document
    document.body.removeChild(node);

    return text;
};
