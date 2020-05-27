import {ISuperdeskGlobalConfig} from 'superdesk-api';

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
