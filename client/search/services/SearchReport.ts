import {cloneDeep, isArray, isBoolean, pickBy} from 'lodash';
import moment from 'moment';

import {IArticle, IRestApiResponse} from 'superdesk-api';
import {
    IReportPayload,
    IReportParams,
    IStateFilter,
    IDataFilter,
    IArchiveStateCode,
    IDateFilter,
    DATA_FIELD,
    ITEM_STATE,
} from '../../interfaces';

import {appConfig, apiQuery, superdeskApi} from '../../superdeskApi';

class SearchReportService {
    getSupportedItemStates(): Array<IStateFilter> {
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
            name: gettext('Recalled'),
        }];
    }

    getSupportedDataFields(): Array<IDataFilter> {
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
        }];
    }

    filterItemStates(states: Array<IArchiveStateCode>): Array<IStateFilter> {
        return this.getSupportedItemStates().filter(
            (state) => states.includes(state.qcode),
        );
    }

    filterDataFields(sources: Array<DATA_FIELD>): Array<IDataFilter> {
        return this.getSupportedDataFields().filter(
            (source) => sources.includes(source.qcode),
        );
    }

    query<t = any>(endpoint: string, params: IReportParams): Promise<t | IRestApiResponse<t>> {
        return apiQuery(endpoint, this.constructParams(params))
            .then((response) => {
                return response?._items?.length === 1 ?
                    response._items[0] :
                    response;
            });
    }

    loadArchiveItem(itemId: string): Promise<IArticle> {
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

    private convertDatesForServer(dates: IDateFilter): void {
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

    private filterValues(value: any): boolean {
        if (isArray(value)) {
            return value.length > 0;
        } else if (isBoolean(value)) {
            return value !== false;
        }

        return value != null;
    }

    private convertStateValues(params: IReportParams): void {
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

    private filterNullParams(params: IReportParams): void {
        params.must = pickBy(params?.must ?? {}, this.filterValues);
        params.must_not = pickBy(params?.must_not ?? {}, this.filterValues);
        params.chart = pickBy(params?.chart ?? {}, this.filterValues);

        if (params?.must?.states != null) {
            const states = pickBy(params.must.states, this.filterValues);

            if (Object.keys(states).length === 0) {
                delete params.must.states;
            } else {
                params.must.states = states;
            }
        }

        if (params?.must_not?.states != null) {
            const states = pickBy(params.must_not.states, this.filterValues);

            if (Object.keys(states).length === 0) {
                delete params.must_not.states;
            } else {
                params.must_not.states = states;
            }
        }
    }

    private constructParams(args: IReportParams): IReportPayload {
        const params = cloneDeep(args);

        this.convertDatesForServer(params.dates);
        this.convertStateValues(params);
        this.filterNullParams(params);

        delete params.aggs;
        delete params.repos;
        delete params.return_type;

        const payload: IReportPayload = {params};

        if (args.aggs != null) {
            payload.aggs = args.aggs;
        }

        if (args.repos != null) {
            payload.repo = pickBy(args.repos, this.filterValues);
        }

        if (args.return_type != null) {
            payload.return_type = args.return_type;
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
}

export const searchReport = new SearchReportService();
