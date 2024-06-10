import {cloneDeep, isArray, isBoolean, pickBy} from 'lodash';
import moment from 'moment';

import {IArticle, IRestApiResponse} from 'superdesk-api';
import {
    DATA_FIELD,
    IArchiveStateCode,
    IDataFilter,
    IDateFilter,
    IReportParams,
    IReportPayload,
    IStateFilter,
    ITEM_STATE,
} from '../../interfaces';

import {apiQuery, appConfig, superdeskApi} from '../../superdeskApi';

function filterItemStates(states: Array<IArchiveStateCode>): Array<IStateFilter> {
    return getSupportedItemStates().filter(
        (state) => states.includes(state.qcode),
    );
}

function filterDataFields(sources: Array<DATA_FIELD>): Array<IDataFilter> {
    return getSupportedDataFields().filter(
        (source) => sources.includes(source.qcode),
    );
}

function query<t = any>(endpoint: string, params: IReportParams): Promise<t | IRestApiResponse<t>> {
    return apiQuery(endpoint, constructParams(params))
        .then((response) => {
            return response?._items?.length === 1 ?
                response._items[0] :
                response;
        });
}

function loadArchiveItem(itemId: string): Promise<IArticle> {
    return apiQuery<IArticle>('search', {
        repo: 'archive,published,archived',
        source: {
            query: {
                filtered: {
                    filter: {
                        or: [
                            {term: {_id: itemId}},
                            {term: {item_id: itemId}},
                        ],
                    },
                },
            },
            sort: [{versioncreated: 'desc'}],
            from: 0,
            size: 1,
        },
    })
        .then((result) => {
            if (result?._items?.[0] != null) {
                return result._items[0];
            }

            const gettext = superdeskApi.localization.gettext;

            return Promise.reject(gettext('Item not found!'));
        });
}

export const searchReportService = {
    filterItemStates,
    filterDataFields,
    query,
    loadArchiveItem,
};

function getSupportedItemStates(): Array<IStateFilter> {
    const gettext = superdeskApi.localization.gettext;

    return [{
        qcode: ITEM_STATE.PUBLISHED,
        name: gettext('Published'),
    }, {
        qcode: ITEM_STATE.KILLED,
        name: gettext('Killed'),
    }, {
        qcode: ITEM_STATE.CORRECTED,
        name: gettext('Corrected'),
    }, {
        qcode: ITEM_STATE.RECALLED,
        name: gettext('Taken Down'),
    }];
}

function getSupportedDataFields(): Array<IDataFilter> {
    const gettext = superdeskApi.localization.gettext;

    return [{
        qcode: DATA_FIELD.CATEGORY,
        name: gettext('Category'),
    }, {
        qcode: DATA_FIELD.GENRE,
        name: gettext('Genre'),
    }, {
        qcode: DATA_FIELD.SOURCE,
        name: gettext('Source'),
    }, {
        qcode: DATA_FIELD.URGENCY,
        name: gettext('Urgency'),
    }, {
        qcode: DATA_FIELD.DESK,
        name: gettext('Desk'),
    }, {
        qcode: DATA_FIELD.USER,
        name: gettext('User'),
    }, {
        qcode: DATA_FIELD.SUBJECT,
        name: gettext('Subject'),
    }, {
        qcode: DATA_FIELD.AUTHOR,
        name: gettext('Author'),
    }, {
        qcode: DATA_FIELD.STATE,
        name: gettext('State'),
    }, {
        qcode: DATA_FIELD.LANGUAGE,
        name: gettext('Language'),
    }];
}

function convertDatesForServer(dates: IDateFilter): void {
    if (dates?.start != null) {
        dates.start = moment(dates.start, appConfig.model.dateformat)
            .format('YYYY-MM-DD');
    }

    if (dates?.end != null) {
        dates.end = moment(dates.end, appConfig.model.dateformat)
            .format('YYYY-MM-DD');
    }

    if (dates?.date != null) {
        dates.date = moment(dates.date, appConfig.model.dateformat)
            .format('YYYY-MM-DD');
    }

    if (dates?.filter != null && dates.filter !== 'range') {
        delete dates.start;
        delete dates.end;
    }
}

function filterValues(value: any): boolean {
    if (isArray(value)) {
        return value.length > 0;
    } else if (isBoolean(value)) {
        return value !== false;
    }

    return value != null;
}

function convertStateValues(params: IReportParams): void {
    // If states filter is provided as an array
    // Then convert it to boolean attributes here
    if (Array.isArray(params?.must?.states) && params.must.states.length > 0) {
        const states = params.must.states;

        params.must.states = {};
        states.forEach((state) => {
            params.must.states[state] = true;
        });
    } else if (Array.isArray(params?.must_not?.states) && params.must_not.states.length > 0) {
        const states = params.must_not.states;

        params.must_not.states = {};
        states.forEach((state) => {
            params.must_not.states[state] = true;
        });
    }
}

function filterNullParams(params: IReportParams): void {
    params.must = pickBy(params?.must ?? {}, filterValues);
    params.must_not = pickBy(params?.must_not ?? {}, filterValues);
    params.chart = pickBy(params?.chart ?? {}, filterValues);

    if (params?.must?.states != null) {
        const states = pickBy(params.must.states, filterValues);

        if (Object.keys(states).length === 0) {
            delete params.must.states;
        } else {
            params.must.states = states;
        }
    }

    if (params?.must_not?.states != null) {
        const states = pickBy(params.must_not.states, filterValues);

        if (Object.keys(states).length === 0) {
            delete params.must_not.states;
        } else {
            params.must_not.states = states;
        }
    }
}

function constructParams(args: IReportParams): IReportPayload {
    const params = cloneDeep(args);

    convertDatesForServer(params.dates);
    convertStateValues(params);
    filterNullParams(params);

    delete params.aggs;
    delete params.repos;
    delete params.return_type;
    delete params.show_all_desks;

    const payload: IReportPayload = {params};

    if (args.aggs != null) {
        payload.aggs = args.aggs;
    }

    if (args.repos != null) {
        payload.repo = pickBy(args.repos, filterValues);
    }

    if (args.return_type != null) {
        payload.return_type = args.return_type;
    }

    if (args.show_all_desks != null) {
        payload.show_all_desks = args.show_all_desks;
    }

    if (args.size != null) {
        payload.size = args.size;
        payload.max_results = args.size;
    }

    if (args.page != null) {
        payload.page = args.page;
    }

    if (args.sort != null) {
        payload.sort = args.sort;
    }

    return payload;
}
