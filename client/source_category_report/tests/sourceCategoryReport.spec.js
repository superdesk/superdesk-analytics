describe('sourceCategoryReport', () => {
    let mocks;
    let sourceCategoryReport;
    let session;

    beforeEach(window.module('superdesk.core.auth.session'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('angularMoment'));

    beforeEach(window.module('superdesk.analytics.source-category-report'));

    beforeEach(() => {
        mocks = {
            endpoint: {save: jasmine.createSpy('api_save')},
        };
        mocks.api = jasmine.createSpy('api').and.returnValue(mocks.endpoint);

        window.module(($provide) => {
            $provide.service('api', () => mocks.api);

            // User the superdesk.config.js/webpack.config.js application config
            // eslint-disable-next-line no-undef
            $provide.constant('config', __SUPERDESK_CONFIG__);
        });
    });

    beforeEach(inject((_sourceCategoryReport_, _session_) => {
        sourceCategoryReport = _sourceCategoryReport_;
        session = _session_;
    }));

    it('can call api save for source_category_report endpoint', () => {
        sourceCategoryReport.generate({});

        expect(mocks.api).toHaveBeenCalledWith('source_category_report', session.identity);
        expect(mocks.endpoint.save).toHaveBeenCalledWith({}, {
            query: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [],
                                must_not: [],
                            },
                        },
                    },
                },
                size: 0,
            },
            repos: [],
        });
    });

    it('can generate list of excluded states', () => {
        sourceCategoryReport.generate({
            excluded_states: {
                published: false,
                killed: true,
                corrected: true,
                recalled: true,
                rewrite_of: true,
            },
        });

        expect(mocks.endpoint.save).toHaveBeenCalledWith({}, {
            query: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [],
                                must_not: [
                                    {terms: {state: ['killed', 'corrected', 'recalled', 'rewrite_of']}},
                                ],
                            },
                        },
                    },
                },
                size: 0,
            },
            repos: [],
        });
    });

    it('can generate the list of repos to search', () => {
        sourceCategoryReport.generate({
            repos: {
                ingest: false,
                archive: false,
                published: true,
                archived: true,
            },
        });

        expect(mocks.endpoint.save).toHaveBeenCalledWith({}, {
            query: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [],
                                must_not: [],
                            },
                        },
                    },
                },
                size: 0,
            },
            repos: ['published', 'archived'],
        });
    });

    it('can generate the date filters', () => {
        // Range
        sourceCategoryReport.generate({
            dateFilter: 'range',
            start_date: '01/06/2018',
            end_date: '30/06/2018',
        });
        expect(mocks.endpoint.save).toHaveBeenCalledWith({}, {
            query: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: '2018-06-30T23:59:59+0100',
                                            gte: '2018-06-01T00:00:00+0100',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                size: 0,
            },
            repos: [],
        });

        // Yesterday
        sourceCategoryReport.generate({dateFilter: 'yesterday'});
        expect(mocks.endpoint.save).toHaveBeenCalledWith({}, {
            query: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: 'now/d',
                                            gte: 'now-1d/d',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                size: 0,
            },
            repos: [],
        });

        // Last Week
        sourceCategoryReport.generate({dateFilter: 'last_week'});
        expect(mocks.endpoint.save).toHaveBeenCalledWith({}, {
            query: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: 'now/w',
                                            gte: 'now-1w/w',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                size: 0,
            },
            repos: [],
        });

        // Last Month
        sourceCategoryReport.generate({dateFilter: 'last_month'});
        expect(mocks.endpoint.save).toHaveBeenCalledWith({}, {
            query: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: 'now/M',
                                            gte: 'now-1M/M',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                size: 0,
            },
            repos: [],
        });
    });
});
