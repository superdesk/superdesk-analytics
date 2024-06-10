import {Moment} from 'moment';
import {ISuperdeskGlobalConfig} from 'superdesk-api';

// Copied from superdesk-api.d.ts as the following error occurs if importing ITEM_STATE here and another ts file
// "Module not found: Error: Can't resolve 'superdesk-api'"
export enum ITEM_STATE {
    PUBLISHED = 'published',
    CORRECTED = 'corrected',
    KILLED = 'killed',
    RECALLED = 'recalled',

    // Special state in analytics for published items that have 'rewrite_of' attribute (i.e. an update)
    UPDATED = 'updated',
}

export enum DATE_FILTER {
    RANGE = 'range',
    DAY = 'day',
    RELATIVE_HOURS = 'relative_hours',
    RELATIVE_DAYS = 'relative_days',
    YESTERDAY = 'yesterday',
    TODAY = 'today',
    RELATIVE_WEEKS = 'relative_weeks',
    LAST_WEEK = 'last_week',
    THIS_WEEK = 'this_week',
    RELATIVE_MONTHS = 'relative_months',
    LAST_MONTH = 'last_month',
    THIS_MONTH = 'this_month',
    LAST_YEAR = 'last_year',
    THIS_YEAR = 'this_year',
}

export enum DATA_FIELD {
    DESK = 'task.desk',
    USER = 'task.user',
    CATEGORY = 'anpa_category.qcode',
    SOURCE = 'source',
    URGENCY = 'urgency',
    GENRE = 'genre.qcode',
    SUBJECT = 'subject.qcode',
    AUTHOR = 'authors.parent',
    STATE = 'state',
    LANGUAGE = 'language'
}

export enum REPORT_RESPONSE_TYPE {
    AGGREGATIONS = 'aggregations',
    HIGHCHARTS_CONFIG = 'highcharts_config',
    CSV = 'text/csv',
    HTML = 'text/html',
}

export enum CHART_TYPE {
    BAR = 'bar',
    COLUMN = 'column',
    TABLE = 'table',
    AREA = 'area',
    LINE = 'line',
    PIE = 'pie',
    SCATTER = 'scatter',
    SPLINE = 'spline',
}

export enum CHART_SORT {
    ASCENDING = 'asc',
    DESCENDING = 'desc',
}

export type IArchiveStateCode =
    ITEM_STATE.PUBLISHED
    | ITEM_STATE.KILLED
    | ITEM_STATE.CORRECTED
    | ITEM_STATE.RECALLED;

export interface IReposFilter {
    ingest?: boolean;
    archive?: boolean;
    published?: boolean;
    archived?: boolean;
}

export interface IStateFilter {
    qcode: IArchiveStateCode;
    name: string;
}

export interface IDataFilter {
    qcode: DATA_FIELD;
    name: string;
}

export interface IDateFilter {
    start: string | Date | Moment;
    end: string | Date | Moment;
    date: string | Date | Moment;
    filter: DATE_FILTER;
}

export interface IBaseReportParams {
    dates?: IDateFilter;
    must?: { [key: string]: any };
    must_not?: { [key: string]: any };
    chart?: {
        type?: CHART_TYPE;
        sort_order?: CHART_SORT;
        title?: string;
        subtitle?: string;
    };
    size?: number;
    page?: number;
    sort?: Array<{ [key: string]: string }>;
    min?: number;
    max?: number;
}

export interface IReportParams extends IBaseReportParams {
    aggs?: {
        group?: {
            field?: DATA_FIELD;
            size?: number;
        };
        subgroup?: {
            field?: DATA_FIELD;
            size?: number;
        };
    };
    repos?: IReposFilter;
    return_type?: REPORT_RESPONSE_TYPE;
    show_all_desks?: number;
}

export interface IReportPayload {
    params?: IBaseReportParams;
    aggs?: { [key: string]: any };
    repo?: IReposFilter;
    return_type?: REPORT_RESPONSE_TYPE;
    size?: number;
    max_results?: number;
    page?: number;
    sort?: Array<{ [key: string]: string }>;
    show_all_desks?: number;
}

export interface IAnalyticsConfig extends ISuperdeskGlobalConfig {
    highcharts?: {
        license?: {
            id?: string;
            type?: string;
            licensee?: string;
            contact?: string;
            customer_id?: string;
            expiry?: string;
        };
    };
}
