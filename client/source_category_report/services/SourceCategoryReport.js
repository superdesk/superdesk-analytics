import {formatDateForServer} from '../../utils';

SourceCategoryReport.$inject = ['api', 'session', '$q', 'moment', 'config'];

export function SourceCategoryReport(api, session, $q, moment, config) {
    var toDelete = ['_id', '_etag', 'report'];

    this.generate = function(reportParams) {
        if (!reportParams) {
            return $q.reject('Invalid report parameters');
        }

        toDelete.forEach((field) => {
            delete reportParams[field];
        });

        return api('source_category_report', session.identity).save({}, {
            start_date: formatDateForServer(moment, config, reportParams.start_date),
            end_date: formatDateForServer(moment, config, reportParams.end_date, 1),
        })
            .then((report) => report);
    };
}
