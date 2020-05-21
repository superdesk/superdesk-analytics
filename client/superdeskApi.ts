import {ISuperdesk, IRestApiResponse} from 'superdesk-api';
import {appConfig} from 'superdesk-core/scripts/appConfig';
import ng from 'superdesk-core/scripts/core/services/ng';

// will be set asynchronously on analytics module start
// members can't be accessed in root module scope synchronously

// DO NOT USE OUTSIDE .ts OR .tsx FILES
// because it would make it harder to find and update usages when API changes

export const superdeskApi = {} as ISuperdesk;
export {appConfig};

export function getService<t = any>(name: string): Promise<t> {
    return ng.getService(name);
}

export function apiQuery<t = any>(endpoint: string, params: {[key: string]: any}): Promise<IRestApiResponse<t>> {
    return getService('api')
        .then((api) => api.query(endpoint, params));
}
