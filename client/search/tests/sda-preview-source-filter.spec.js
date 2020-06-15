import {mockAll} from '../../tests/mocks';

describe('sda-preview-source-filter', () => {
    let $compile;
    let $rootScope;
    let element;
    let html;

    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.apps.users'));
    beforeEach(window.module('superdesk.apps.desks'));
    beforeEach(window.module('superdesk.analytics.charts'));
    beforeEach(window.module('superdesk.analytics.search'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    mockAll();

    const compileElement = (params) => {
        const scope = $rootScope.$new();

        scope.report = {params: params};
        element = $compile('<div sda-preview-source-filter></div>')(scope);

        $rootScope.$digest();
        html = element.html();
    };

    it('can render desks', () => {
        compileElement({must: {desks: ['desk1']}});
        expect(html).toContain('Desks');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>Politic Desk</p>');

        compileElement({must_not: {desks: ['desk2', 'desk3']}});
        expect(html).toContain('Desks');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>Sports Desk, System Desk</p>');
    });

    it('can render users', () => {
        compileElement({must: {users: ['user1']}});
        expect(html).toContain('Users');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>first user</p>');

        compileElement({must_not: {users: ['user2', 'user3']}});
        expect(html).toContain('Users');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>second user, last user</p>');
    });

    it('can render categories', () => {
        compileElement({must: {categories: ['a']}});
        expect(html).toContain('Categories');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>Advisories</p>');

        compileElement({must_not: {categories: ['b', 'c']}});
        expect(html).toContain('Categories');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>Basketball, Cricket</p>');
    });

    it('can render genre', () => {
        compileElement({must: {genre: ['Article']}});
        expect(html).toContain('Genre');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>Article (news)</p>');

        compileElement({must_not: {genre: ['Sidebar', 'Factbox']}});
        expect(html).toContain('Genre');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>Sidebar, Factbox</p>');
    });

    it('can render sources', () => {
        compileElement({must: {sources: ['aap']}});
        expect(html).toContain('Sources');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>aap</p>');

        compileElement({must_not: {sources: ['aap', 'test']}});
        expect(html).toContain('Sources');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>aap, test</p>');
    });

    it('can render states', () => {
        compileElement({
            must: {
                states: {
                    published: true,
                    killed: false,
                    corrected: true,
                    recalled: false,
                },
            },
        });
        expect(html).toContain('States');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>New, Corrections</p>');

        compileElement({
            must_not: {
                states: {
                    published: false,
                    killed: true,
                    corrected: false,
                    recalled: true,
                },
            },
        });
        expect(html).toContain('States');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>Kills, Takedowns</p>');
    });

    it('can render ingest providers', () => {
        compileElement({must: {ingest_providers: ['ing1']}});
        expect(html).toContain('Ingest Providers');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>Ingest 1</p>');

        compileElement({must_not: {ingest_providers: ['ing1', 'ing2']}});
        expect(html).toContain('Ingest Providers');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>Ingest 1, Ingest 2</p>');
    });

    it('can render stages', () => {
        compileElement({must: {stages: ['stage1']}});
        expect(html).toContain('Stages');
        expect(html).not.toContain('Exclude</span>');
        expect(html).toContain('>Politic Desk/Stage 1</p>');

        compileElement({must_not: {stages: ['stage2', 'stage3']}});
        expect(html).toContain('Stages');
        expect(html).toContain('Exclude</span>');
        expect(html).toContain('>Politic Desk/Stage 2, Sports Desk/Stage 3</p>');
    });
});
