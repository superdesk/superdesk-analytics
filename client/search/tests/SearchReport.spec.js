import {appConfig} from 'appConfig';

describe('searchReport', () => {
    let searchReport;
    let api;
    let $q;

    beforeEach(() => {
        // Use the superdesk.config.js/webpack.config.js application config
        Object.assign(appConfig, {
            // eslint-disable-next-line no-undef
            ...__SUPERDESK_CONFIG__,
            server: {url: ''},
            defaultTimezone: 'UTC',
        });
    });

    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.analytics.search'));

    beforeEach(inject((_searchReport_, _api_, _$q_) => {
        searchReport = _searchReport_;
        api = _api_;
        $q = _$q_;

        spyOn(api, 'query').and.returnValue($q.when({_items: []}));
    }));

    describe('can send query as param object', () => {
        it('param object for dates', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'range',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {
                        filter: 'range',
                        start: '2018-06-01',
                        end: '2018-06-30',
                    },
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });

            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'yesterday',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });

            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'range',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {
                        filter: 'range',
                        start: '2018-06-01',
                        end: '2018-06-30',
                    },
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });

            searchReport.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'yesterday',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
            });
        });

        it('param object for filtered must/must_not', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    must: {
                        desks: [],
                        users: ['user1', 'user2'],
                        states: {
                            published: true,
                            killed: false,
                        },
                    },
                    must_not: {
                        urgency: [],
                        categories: ['a', 'b'],
                        rewrites: false,
                    },
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {
                        users: ['user1', 'user2'],
                        states: {published: true},
                    },
                    must_not: {
                        categories: ['a', 'b'],
                    },
                    chart: {},
                },
            });
        });

        it('includes aggregations', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    aggs: {
                        group: {field: 'anpa_category.qcode'},
                        subgroup: {field: 'urgency'},
                    },
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
                aggs: {
                    group: {field: 'anpa_category.qcode'},
                    subgroup: {field: 'urgency'},
                },
            });
        });

        it('includes repos', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    repos: {
                        ingest: false,
                        archive: false,
                        published: true,
                        archived: true,
                    },
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
                repo: {
                    published: true,
                    archived: true,
                },
            });
        });

        it('includes return_type', () => {
            searchReport.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    return_type: 'highcharts_config',
                }
            );

            expect(api.query).toHaveBeenCalledWith('source_category_report', {
                params: {
                    dates: {filter: 'yesterday'},
                    must: {},
                    must_not: {},
                    chart: {},
                },
                return_type: 'highcharts_config',
            });
        });
    });
});
