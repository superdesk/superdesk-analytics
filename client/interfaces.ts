import {ISuperdeskGlobalConfig} from 'superdesk-api';

export interface IAnalyticsConfig extends ISuperdeskGlobalConfig{
    highcharts_license_type?: string;
    highcharts_licensee?: string;
    highcharts_license_id?: string;
    highcharts_license_expiry?: string;
    highcharts_license_customer_id?: string;
    highcharts_licensee_contact?: string;
}
