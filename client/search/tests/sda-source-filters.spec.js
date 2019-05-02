import {mockAll} from '../../tests/mocks';

describe('sda-source-filters', () => {
    let $compile;
    let $rootScope;
    let scope;
    let isoScope;
    let fields;
    let params;
    let element;
    let userList;
    let desks;
    let metadata;
    let searchReport;
    let ingestSources;

    beforeEach(window.module(($provide) => {
        // Use the superdesk.config.js/webpack.config.js application config
        $provide.constant('config', {
            // eslint-disable-next-line no-undef
            ...__SUPERDESK_CONFIG__,
            server: {url: ''},
            defaultTimezone: 'UTC',
        });
    }));

    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.apps.users'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.analytics.search'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    beforeEach(inject((_userList_, _desks_, _metadata_, _searchReport_, _ingestSources_) => {
        userList = _userList_;
        desks = _desks_;
        metadata = _metadata_;
        searchReport = _searchReport_;
        ingestSources = _ingestSources_;

        fields = undefined;
        params = {
            must: {},
            must_not: {},
        };
    }));

    mockAll();

    const compileElement = () => {
        scope = $rootScope.$new();
        scope.fields = fields;
        scope.params = params;

        element = $compile(
            `<div sda-source-filters
                  data-fields="fields"
                  data-params="params"
            ></div>`
        )(scope);

        $rootScope.$digest();
        isoScope = element.isolateScope();
    };

    it('renders the source filters', () => {
        fields = ['sources'];
        compileElement();

        expect(searchReport.query).toHaveBeenCalledWith(
            'content_publishing_report',
            {
                aggs: {group: {field: 'source'}},
                repos: {
                    ingest: false,
                    archive: false,
                    published: true,
                    archived: true,
                },
            },
            true
        );
        expect(element.html()).toContain('filters.sources.label');
        expect(isoScope.filters.sources.items).toEqual([{
            _id: 'aap',
            name: 'AAP',
        }, {
            _id: 'test',
            name: 'TEST',
        }]);
        expect(isoScope.filters.sources.selected).toEqual([]);

        params = {must: {sources: ['aap']}};
        compileElement();
        expect(isoScope.filters.sources.selected).toEqual([{
            _id: 'aap',
            name: 'AAP',
        }]);
        expect(isoScope.filters.sources.exclude).toBe(false);

        params = {must_not: {sources: ['test']}};
        compileElement();
        expect(isoScope.filters.sources.selected).toEqual([{
            _id: 'test',
            name: 'TEST',
        }]);
        expect(isoScope.filters.sources.exclude).toBe(true);

        isoScope.filters.sources.selected = [{
            _id: 'aap',
            name: 'AAP',
        }];
        isoScope.onFilterChanged(isoScope.filters.sources);
        expect(scope.params).toEqual({
            must_not: {sources: ['aap']},
            rewrites: 'include',
        });

        isoScope.filters.sources.exclude = false;
        isoScope.onFilterChanged(isoScope.filters.sources);
        expect(scope.params).toEqual({
            must_not: {},
            must: {sources: ['aap']},
            rewrites: 'include',
        });
    });

    it('synchronize params to filter values', () => {
        fields = ['sources'];
        compileElement();

        expect(isoScope.filters.sources.items).toEqual([{
            _id: 'aap',
            name: 'AAP',
        }, {
            _id: 'test',
            name: 'TEST',
        }]);
        expect(isoScope.filters.sources.selected).toEqual([]);
        expect(isoScope.filters.sources.exclude).toBe(false);
        expect(scope.params).toEqual({
            must: {},
            must_not: {},
            rewrites: 'include',
        });

        scope.params = {
            must: {sources: ['aap']},
            must_not: {},
        };
        $rootScope.$apply();
        expect(isoScope.filters.sources.selected).toEqual([{
            _id: 'aap',
            name: 'AAP',
        }]);
        expect(isoScope.filters.sources.exclude).toBe(false);

        scope.params = {
            must: {},
            must_not: {sources: ['test']},
        };
        $rootScope.$apply();
        expect(isoScope.filters.sources.selected).toEqual([{
            _id: 'test',
            name: 'TEST',
        }]);
        expect(isoScope.filters.sources.exclude).toBe(true);
    });

    it('synchronize filter values to params', () => {
        fields = ['sources'];
        compileElement();

        expect(isoScope.filters.sources.items).toEqual([{
            _id: 'aap',
            name: 'AAP',
        }, {
            _id: 'test',
            name: 'TEST',
        }]);
        expect(isoScope.filters.sources.selected).toEqual([]);
        expect(isoScope.filters.sources.exclude).toBe(false);
        expect(scope.params).toEqual({
            must: {},
            must_not: {},
            rewrites: 'include',
        });

        isoScope.filters.sources.selected = [{
            _id: 'aap',
            name: 'AAP',
        }];
        isoScope.onFilterChanged(isoScope.filters.sources);
        expect(scope.params).toEqual({
            must: {sources: ['aap']},
            must_not: {},
            rewrites: 'include',
        });

        isoScope.filters.sources.selected = [{
            _id: 'test',
            name: 'TEST',
        }];
        isoScope.filters.sources.exclude = true;
        isoScope.onFilterChanged(isoScope.filters.sources);
        expect(scope.params).toEqual({
            must: {},
            must_not: {sources: ['test']},
            rewrites: 'include',
        });
    });

    it('loads list of users', () => {
        fields = [];
        compileElement();
        expect(userList.getAll).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.users.label');
        expect(isoScope.filters.users.items).toEqual([]);

        fields = ['users'];
        compileElement();
        expect(userList.getAll).toHaveBeenCalled();
        expect(element.html()).toContain('filters.users.label');
        expect(isoScope.filters.users.items).toEqual([
            {_id: 'user1', display_name: 'first user', is_active: true, is_enabled: true, needs_activation: false},
            {_id: 'user3', display_name: 'last user', is_active: true, is_enabled: true, needs_activation: false},
            {_id: 'user2', display_name: 'second user', is_active: true, is_enabled: true, needs_activation: false},
        ]);
        expect(isoScope.filters.users.selected).toEqual([]);
        expect(isoScope.filters.users.exclude).toBe(false);

        params = {must: {users: ['user1']}};
        compileElement();
        expect(isoScope.filters.users.selected).toEqual([
            {_id: 'user1', display_name: 'first user', is_active: true, is_enabled: true, needs_activation: false},
        ]);
        expect(isoScope.filters.users.exclude).toBe(false);

        params = {must_not: {users: ['user2']}};
        compileElement();
        expect(isoScope.filters.users.selected).toEqual([
            {_id: 'user2', display_name: 'second user', is_active: true, is_enabled: true, needs_activation: false},
        ]);
        expect(isoScope.filters.users.exclude).toBe(true);
    });

    it('loads list of desks', () => {
        fields = [];
        compileElement();
        expect(desks.initialize).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.desks.label');
        expect(isoScope.filters.desks.items).toEqual([]);

        fields = ['desks'];
        compileElement();
        expect(desks.initialize).toHaveBeenCalled();
        expect(element.html()).toContain('filters.desks.label');
        expect(isoScope.filters.desks.items).toEqual([
            {_id: 'desk1', name: 'Politic Desk'},
            {_id: 'desk2', name: 'Sports Desk'},
            {_id: 'desk3', name: 'System Desk'},
        ]);
        expect(isoScope.filters.desks.selected).toEqual([]);
        expect(isoScope.filters.desks.exclude).toBe(false);

        params = {must: {desks: ['desk1']}};
        compileElement();
        expect(isoScope.filters.desks.selected).toEqual([
            {_id: 'desk1', name: 'Politic Desk'},
        ]);
        expect(isoScope.filters.desks.exclude).toBe(false);

        params = {must_not: {desks: ['desk2']}};
        compileElement();
        expect(isoScope.filters.desks.selected).toEqual([
            {_id: 'desk2', name: 'Sports Desk'},
        ]);
        expect(isoScope.filters.desks.exclude).toBe(true);
    });

    it('loads list of stages', () => {
        fields = [];
        compileElement();
        expect(desks.initialize).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.stages.label');
        expect(isoScope.filters.stages.items).toEqual([]);

        fields = ['stages'];
        compileElement();
        expect(desks.initialize).toHaveBeenCalled();
        expect(element.html()).toContain('filters.stages.label');
        expect(isoScope.filters.stages.items).toEqual([
            {_id: 'stage1', name: 'Politic Desk/Stage 1'},
            {_id: 'stage2', name: 'Politic Desk/Stage 2'},
            {_id: 'stage3', name: 'Sports Desk/Stage 3'},
        ]);
        expect(isoScope.filters.stages.selected).toEqual([]);
        expect(isoScope.filters.stages.exclude).toBe(false);

        params = {must: {stages: ['stage1']}};
        compileElement();
        expect(isoScope.filters.stages.selected).toEqual([
            {_id: 'stage1', name: 'Politic Desk/Stage 1'},
        ]);
        expect(isoScope.filters.stages.exclude).toBe(false);

        params = {must_not: {stages: ['stage2', 'stage3']}};
        compileElement();
        expect(isoScope.filters.stages.selected).toEqual([
            {_id: 'stage2', name: 'Politic Desk/Stage 2'},
            {_id: 'stage3', name: 'Sports Desk/Stage 3'},
        ]);
        expect(isoScope.filters.stages.exclude).toBe(true);
    });

    it('loads list of categories', () => {
        fields = [];
        compileElement();
        expect(metadata.initialize).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.categories.label');
        expect(isoScope.filters.categories.items).toEqual([]);

        fields = ['categories'];
        compileElement();
        expect(metadata.initialize).toHaveBeenCalled();
        expect(element.html()).toContain('filters.categories.label');
        expect(isoScope.filters.categories.items).toEqual([
            {qcode: 'a', name: 'Advisories'},
            {qcode: 'b', name: 'Basketball'},
            {qcode: 'c', name: 'Cricket'},
        ]);
        expect(isoScope.filters.categories.selected).toEqual([]);
        expect(isoScope.filters.categories.exclude).toBe(false);

        params = {must: {categories: ['a']}};
        compileElement();
        expect(isoScope.filters.categories.selected).toEqual([
            {qcode: 'a', name: 'Advisories'},
        ]);
        expect(isoScope.filters.categories.exclude).toBe(false);

        params = {must_not: {categories: ['b', 'c']}};
        compileElement();
        expect(isoScope.filters.categories.selected).toEqual([
            {qcode: 'b', name: 'Basketball'},
            {qcode: 'c', name: 'Cricket'},
        ]);
        expect(isoScope.filters.categories.exclude).toBe(true);
    });

    it('loads list of genres', () => {
        fields = [];
        compileElement();
        expect(metadata.initialize).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.genre.label');
        expect(isoScope.filters.genre.items).toEqual([]);

        fields = ['genre'];
        compileElement();
        expect(metadata.initialize).toHaveBeenCalled();
        expect(element.html()).toContain('filters.genre.label');
        expect(isoScope.filters.genre.items).toEqual([
            {qcode: 'Article', name: 'Article (news)'},
            {qcode: 'Factbox', name: 'Factbox'},
            {qcode: 'Sidebar', name: 'Sidebar'},
        ]);
        expect(isoScope.filters.genre.selected).toEqual([]);
        expect(isoScope.filters.genre.exclude).toBe(false);

        params = {must: {genre: ['Article']}};
        compileElement();
        expect(isoScope.filters.genre.selected).toEqual([
            {qcode: 'Article', name: 'Article (news)'},
        ]);
        expect(isoScope.filters.genre.exclude).toBe(false);

        params = {must_not: {genre: ['Sidebar', 'Factbox']}};
        compileElement();
        expect(isoScope.filters.genre.selected).toEqual([
            {qcode: 'Factbox', name: 'Factbox'},
            {qcode: 'Sidebar', name: 'Sidebar'},
        ]);
        expect(isoScope.filters.genre.exclude).toBe(true);
    });

    it('loads list of urgencies', () => {
        fields = [];
        compileElement();
        expect(metadata.initialize).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.urgency.label');
        expect(isoScope.filters.urgency.items).toEqual([]);

        fields = ['urgency'];
        compileElement();
        expect(metadata.initialize).toHaveBeenCalled();
        expect(element.html()).toContain('filters.urgency.label');
        expect(isoScope.filters.urgency.items).toEqual([
            {qcode: 1, name: 1},
            {qcode: 2, name: 2},
            {qcode: 3, name: 3},
            {qcode: 4, name: 4},
            {qcode: 5, name: 5},
        ]);
        expect(isoScope.filters.urgency.selected).toEqual([]);
        expect(isoScope.filters.urgency.exclude).toBe(false);

        params = {must: {urgency: [1]}};
        compileElement();
        expect(isoScope.filters.urgency.selected).toEqual([
            {qcode: 1, name: 1},
        ]);
        expect(isoScope.filters.urgency.exclude).toBe(false);

        params = {must_not: {urgency: [2, 4]}};
        compileElement();
        expect(isoScope.filters.urgency.selected).toEqual([
            {qcode: 2, name: 2},
            {qcode: 4, name: 4},
        ]);
        expect(isoScope.filters.urgency.exclude).toBe(true);
    });

    it('loads list of states', () => {
        fields = [];
        compileElement();
        expect(element.html()).not.toContain('filters.states.label');
        expect(isoScope.filters.states.items).toEqual([
            {qcode: 'published', name: 'Published'},
            {qcode: 'killed', name: 'Killed'},
            {qcode: 'corrected', name: 'Corrected'},
            {qcode: 'recalled', name: 'Recalled'},
        ]);

        fields = ['states'];
        compileElement();
        expect(element.html()).toContain('filters.states.label');
        expect(isoScope.filters.states.selected).toEqual([]);
        expect(isoScope.filters.states.exclude).toBe(false);

        params = {must: {states: ['killed']}};
        compileElement();
        expect(isoScope.filters.states.selected).toEqual([
            {qcode: 'killed', name: 'Killed'},
        ]);
        expect(isoScope.filters.states.exclude).toBe(false);

        params = {must_not: {states: ['corrected', 'recalled']}};
        compileElement();
        expect(isoScope.filters.states.selected).toEqual([
            {qcode: 'corrected', name: 'Corrected'},
            {qcode: 'recalled', name: 'Recalled'},
        ]);
        expect(isoScope.filters.states.exclude).toBe(true);
    });

    it('loads list of ingest providers', () => {
        fields = [];
        compileElement();
        expect(ingestSources.initialize).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.ingest_providers.label');
        expect(isoScope.filters.ingest_providers.items).toEqual([]);

        fields = ['ingest_providers'];
        compileElement();
        expect(ingestSources.initialize).toHaveBeenCalled();
        expect(element.html()).toContain('filters.ingest_providers.label');
        expect(isoScope.filters.ingest_providers.items).toEqual([
            {_id: 'ing1', name: 'Ingest 1'},
            {_id: 'ing2', name: 'Ingest 2'},
            {_id: 'ing3', name: 'Ingest 3'},
        ]);
        expect(isoScope.filters.ingest_providers.selected).toEqual([]);
        expect(isoScope.filters.ingest_providers.exclude).toBe(false);

        params = {must: {ingest_providers: ['ing1']}};
        compileElement();
        expect(isoScope.filters.ingest_providers.selected).toEqual([
            {_id: 'ing1', name: 'Ingest 1'},
        ]);
        expect(isoScope.filters.ingest_providers.exclude).toBe(false);

        params = {must_not: {ingest_providers: ['ing2', 'ing3']}};
        compileElement();
        expect(isoScope.filters.ingest_providers.selected).toEqual([
            {_id: 'ing2', name: 'Ingest 2'},
            {_id: 'ing3', name: 'Ingest 3'},
        ]);
        expect(isoScope.filters.ingest_providers.exclude).toBe(true);
    });
});
