import {appConfig} from 'appConfig';

import {searchReportService} from '../services/SearchReport';

describe('searchReportService', () => {
    let api;

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

    beforeEach(inject((_api_) => {
        api = _api_;

        spyOn(api, 'query').and.returnValue(Promise.resolve({_items: []}));
    }));

    describe('can send query as param object', () => {
        it('param object for dates', (done) => {
            searchReportService.query(
                'source_category_report',
                {
                    dates: {
                        filter: 'range',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                }
            )
                .then(() => {
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

                    return searchReportService.query(
                        'source_category_report',
                        {
                            dates: {
                                filter: 'yesterday',
                                start: '01/06/2018',
                                end: '30/06/2018',
                            },
                        }
                    );
                })
                .then(() => {
                    expect(api.query).toHaveBeenCalledWith('source_category_report', {
                        params: {
                            dates: {filter: 'yesterday'},
                            must: {},
                            must_not: {},
                            chart: {},
                        },
                    });

                    return searchReportService.query(
                        'source_category_report',
                        {
                            dates: {
                                filter: 'range',
                                start: '01/06/2018',
                                end: '30/06/2018',
                            },
                        }
                    );
                })
                .then(() => {
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

                    return searchReportService.query(
                        'source_category_report',
                        {
                            dates: {
                                filter: 'yesterday',
                                start: '01/06/2018',
                                end: '30/06/2018',
                            },
                        }
                    );
                })
                .then(() => {
                    expect(api.query).toHaveBeenCalledWith('source_category_report', {
                        params: {
                            dates: {filter: 'yesterday'},
                            must: {},
                            must_not: {},
                            chart: {},
                        },
                    });

                    done();
                });
        });

        it('param object for filtered must/must_not', (done) => {
            searchReportService.query(
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
            )
                .then(() => {
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

                    done();
                });
        });

        it('includes aggregations', (done) => {
            searchReportService.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    aggs: {
                        group: {field: 'anpa_category.qcode'},
                        subgroup: {field: 'urgency'},
                    },
                }
            )
                .then(() => {
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

                    done();
                });
        });

        it('includes repos', (done) => {
            searchReportService.query(
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
            )
                .then(() => {
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

                    done();
                });
        });

        it('includes return_type', (done) => {
            searchReportService.query(
                'source_category_report',
                {
                    dates: {filter: 'yesterday'},
                    return_type: 'highcharts_config',
                }
            )
                .then(() => {
                    expect(api.query).toHaveBeenCalledWith('source_category_report', {
                        params: {
                            dates: {filter: 'yesterday'},
                            must: {},
                            must_not: {},
                            chart: {},
                        },
                        return_type: 'highcharts_config',
                    });

                    done();
                });
        });
    });
});
