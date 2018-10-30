describe('sda-source-filters', () => {
    let $compile;
    let $rootScope;
    let $q;
    let scope;
    let isoScope;
    let fields;
    let params;
    let runQuery;
    let element;
    let userList;
    let desks;
    let metadata;

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
    beforeEach(window.module('superdesk.analytics'));

    beforeEach(inject((_$compile_, _$rootScope_, _$q_, _userList_, _desks_, _metadata_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $q = _$q_;
        userList = _userList_;
        desks = _desks_;
        metadata = _metadata_;
    }));

    beforeEach(() => {
        fields = undefined;
        params = {
            must: {},
            must_not: {},
        };
        runQuery = jasmine.createSpy().and.returnValue(
            $q.when({groups: {aap: 1, test: 2}})
        );

        spyOn(userList, 'getAll').and.returnValue(
            $q.when([{
                _id: 'user1',
                display_name: 'User 1',
            }, {
                _id: 'user2',
                display_name: 'User 2',
            }])
        );

        spyOn(desks, 'fetchDesks').and.returnValue(
            $q.when({
                _items: [{
                    _id: 'desk1',
                    name: 'Desk 1',
                }, {
                    _id: 'desk2',
                    name: 'Desk 2',
                }]
            })
        );

        spyOn(metadata, 'initialize').and.returnValue($q.when());
        metadata.values = {
            categories: [{
                qcode: 'cat1',
                name: 'Cat 1',
            }, {
                qcode: 'cat2',
                name: 'Cat 2',
            }],
            genre: [{
                qcode: 'gen1',
                name: 'Gen 1',
            }, {
                qcode: 'gen2',
                name: 'Gen 2',
            }],
            urgency: [{
                qcode: 1,
                name: 1,
            }, {
                qcode: 2,
                name: 2,
            }],
        };
    });

    const compileElement = () => {
        scope = $rootScope.$new();
        scope.fields = fields;
        scope.params = params;
        scope.runQuery = runQuery;

        element = $compile(
            `<div sda-source-filters
                  data-fields="fields"
                  data-params="params"
                  data-run-query="runQuery"
            ></div>`
        )(scope);

        $rootScope.$digest();
        isoScope = element.isolateScope();
    };

    it('renders the source filters', () => {
        fields = ['sources'];
        compileElement();

        expect(runQuery).toHaveBeenCalledWith({
            aggs: {group: {field: 'source'}},
            repos: {
                ingest: false,
                archive: false,
                published: true,
                archived: true,
            }
        });
        expect(element.html()).toContain('filters.sources.label');
        expect(isoScope.filters.sources.items).toEqual([{
            _id: 'aap',
            name: 'AAP'
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
        expect(isoScope.filters.users.items).toEqual([{
            _id: 'user1',
            display_name: 'User 1'
        }, {
            _id: 'user2',
            display_name: 'User 2',
        }]);
        expect(isoScope.filters.users.selected).toEqual([]);
        expect(isoScope.filters.users.exclude).toBe(false);

        params = {must: {users: ['user1']}};
        compileElement();
        expect(isoScope.filters.users.selected).toEqual([{
            _id: 'user1',
            display_name: 'User 1',
        }]);
        expect(isoScope.filters.users.exclude).toBe(false);

        params = {must_not: {users: ['user2']}};
        compileElement();
        expect(isoScope.filters.users.selected).toEqual([{
            _id: 'user2',
            display_name: 'User 2',
        }]);
        expect(isoScope.filters.users.exclude).toBe(true);
    });

    it('loads list of desks', () => {
        fields = [];
        compileElement();
        expect(desks.fetchDesks).not.toHaveBeenCalled();
        expect(element.html()).not.toContain('filters.desks.label');
        expect(isoScope.filters.desks.items).toEqual([]);

        fields = ['desks'];
        compileElement();
        expect(desks.fetchDesks).toHaveBeenCalled();
        expect(element.html()).toContain('filters.desks.label');
        expect(isoScope.filters.desks.items).toEqual([{
            _id: 'desk1',
            name: 'Desk 1'
        }, {
            _id: 'desk2',
            name: 'Desk 2',
        }]);
        expect(isoScope.filters.desks.selected).toEqual([]);
        expect(isoScope.filters.desks.exclude).toBe(false);

        params = {must: {desks: ['desk1']}};
        compileElement();
        expect(isoScope.filters.desks.selected).toEqual([{
            _id: 'desk1',
            name: 'Desk 1',
        }]);
        expect(isoScope.filters.desks.exclude).toBe(false);

        params = {must_not: {desks: ['desk2']}};
        compileElement();
        expect(isoScope.filters.desks.selected).toEqual([{
            _id: 'desk2',
            name: 'Desk 2',
        }]);
        expect(isoScope.filters.desks.exclude).toBe(true);
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
        expect(isoScope.filters.categories.items).toEqual([{
            qcode: 'cat1',
            name: 'Cat 1'
        }, {
            qcode: 'cat2',
            name: 'Cat 2',
        }]);
        expect(isoScope.filters.categories.selected).toEqual([]);
        expect(isoScope.filters.categories.exclude).toBe(false);

        params = {must: {categories: ['cat1']}};
        compileElement();
        expect(isoScope.filters.categories.selected).toEqual([{
            qcode: 'cat1',
            name: 'Cat 1',
        }]);
        expect(isoScope.filters.categories.exclude).toBe(false);

        params = {must_not: {categories: ['cat2']}};
        compileElement();
        expect(isoScope.filters.categories.selected).toEqual([{
            qcode: 'cat2',
            name: 'Cat 2',
        }]);
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
        expect(isoScope.filters.genre.items).toEqual([{
            qcode: 'gen1',
            name: 'Gen 1'
        }, {
            qcode: 'gen2',
            name: 'Gen 2',
        }]);
        expect(isoScope.filters.genre.selected).toEqual([]);
        expect(isoScope.filters.genre.exclude).toBe(false);

        params = {must: {genre: ['gen1']}};
        compileElement();
        expect(isoScope.filters.genre.selected).toEqual([{
            qcode: 'gen1',
            name: 'Gen 1',
        }]);
        expect(isoScope.filters.genre.exclude).toBe(false);

        params = {must_not: {genre: ['gen2']}};
        compileElement();
        expect(isoScope.filters.genre.selected).toEqual([{
            qcode: 'gen2',
            name: 'Gen 2',
        }]);
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
        expect(isoScope.filters.urgency.items).toEqual([{
            qcode: 1,
            name: 1
        }, {
            qcode: 2,
            name: 2,
        }]);
        expect(isoScope.filters.urgency.selected).toEqual([]);
        expect(isoScope.filters.urgency.exclude).toBe(false);

        params = {must: {urgency: [1]}};
        compileElement();
        expect(isoScope.filters.urgency.selected).toEqual([{
            qcode: 1,
            name: 1,
        }]);
        expect(isoScope.filters.urgency.exclude).toBe(false);

        params = {must_not: {urgency: [2]}};
        compileElement();
        expect(isoScope.filters.urgency.selected).toEqual([{
            qcode: 2,
            name: 2,
        }]);
        expect(isoScope.filters.urgency.exclude).toBe(true);
    });

    it('loads list of states', () => {
        fields = [];
        compileElement();
        expect(element.html()).not.toContain('filters.states.label');
        expect(isoScope.filters.states.items).toEqual([{
            qcode: 'published',
            name: 'Published',
        }, {
            qcode: 'killed',
            name: 'Killed',
        }, {
            qcode: 'corrected',
            name: 'Corrected',
        }, {
            qcode: 'recalled',
            name: 'Recalled',
        }]);

        fields = ['states'];
        compileElement();
        expect(element.html()).toContain('filters.states.label');
        expect(isoScope.filters.states.selected).toEqual([]);
        expect(isoScope.filters.states.exclude).toBe(false);

        params = {must: {states: ['killed']}};
        compileElement();
        expect(isoScope.filters.states.selected).toEqual([{
            qcode: 'killed',
            name: 'Killed',
        }]);
        expect(isoScope.filters.states.exclude).toBe(false);

        params = {must_not: {states: ['corrected', 'recalled']}};
        compileElement();
        expect(isoScope.filters.states.selected).toEqual([{
            qcode: 'corrected',
            name: 'Corrected',
        }, {
            qcode: 'recalled',
            name: 'Recalled',
        }]);
        expect(isoScope.filters.states.exclude).toBe(true);
    });
});
