describe('searchReport', () => {
    let searchReport;
    let api;
    let $q;

    beforeEach(window.module(($provide) => {
        // Use the superdesk.config.js/webpack.config.js application config
        // eslint-disable-next-line no-undef
        $provide.constant('config', {...__SUPERDESK_CONFIG__, server: {url: ''}});
    }));

    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.analytics.search'));

    beforeEach(inject((_searchReport_, _api_, _$q_) => {
        searchReport = _searchReport_;
        api = _api_;
        $q = _$q_;

        spyOn(api, 'query').and.returnValue($q.when({_items: []}));
    }));

    it('can call api save for source_category_report endpoint', () => {
        searchReport.query('source_category_report', {});

        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
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
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: '',
        });
    });

    it('can generate list of excluded states', () => {
        searchReport.query('source_category_report', {
            excluded_states: {
                published: false,
                killed: true,
                corrected: true,
                recalled: true,
                rewrite_of: true,
            },
        });

        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
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
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: '',
        });
    });

    it('can generate the list of repos to search', () => {
        searchReport.query('source_category_report', {
            repos: {
                ingest: false,
                archive: false,
                published: true,
                archived: true,
            },
        });

        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
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
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: 'published,archived',
        });
    });

    it('can generate the date filters', () => {
        // Range
        searchReport.query('source_category_report', {
            dateFilter: 'range',
            start_date: '01/06/2018',
            end_date: '30/06/2018',
        });
        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: '2018-06-30T23:59:59+0100',
                                            gte: '2018-06-01T00:00:00+0100',
                                            time_zone: '+01:00',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: '',
        });

        // Yesterday
        searchReport.query('source_category_report', {dateFilter: 'yesterday'});
        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: 'now/d',
                                            gte: 'now-1d/d',
                                            time_zone: '+01:00',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: '',
        });

        // Last Week
        searchReport.query('source_category_report', {dateFilter: 'last_week'});
        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: 'now/w',
                                            gte: 'now-1w/w',
                                            time_zone: '+01:00',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: '',
        });

        // Last Month
        searchReport.query('source_category_report', {dateFilter: 'last_month'});
        expect(api.query).toHaveBeenCalledWith('source_category_report', {
            source: {
                query: {
                    filtered: {
                        filter: {
                            bool: {
                                must: [{
                                    range: {
                                        versioncreated: {
                                            lt: 'now/M',
                                            gte: 'now-1M/M',
                                            time_zone: '+01:00',
                                        },
                                    },
                                }],
                                must_not: [],
                            },
                        },
                    },
                },
                sort: [{versioncreated: 'desc'}],
                size: 0,
            },
            repo: '',
        });
    });
});
