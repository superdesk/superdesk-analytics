
export function mockAll() {
    beforeEach(inject((_$q_, _userList_, _desks_, _metadata_, _searchReport_, _ingestSources_) => {
        mockUsers(_userList_, _$q_);
        mockDesks(_desks_, _$q_);
        mockMetadata(_metadata_, _$q_);
        mockSearchQuery(_searchReport_, _$q_);
        mockIngestSources(_ingestSources_, _$q_);
    }));
}

export function mockDesks(desks, $q) {
    // eslint-disable-next-line jasmine/no-unsafe-spy
    spyOn(desks, 'initialize').and.callFake(() => {
        desks.desks = {
            _items: [
                {_id: 'desk1', name: 'Politic Desk'},
                {_id: 'desk2', name: 'Sports Desk'},
                {_id: 'desk3', name: 'System Desk'},
            ],
        };

        desks.deskStages = {
            desk1: [
                {_id: 'stage1', name: 'Stage 1'},
                {_id: 'stage2', name: 'Stage 2'},
            ],
            desk2: [
                {_id: 'stage3', name: 'Stage 3'},
            ],
            desk3: [],
        };

        desks.deskLookup = {
            desk1: {_id: 'desk1', name: 'Politic Desk'},
            desk2: {_id: 'desk2', name: 'Sports Desk'},
            desk3: {_id: 'desk3', name: 'System Desk'},
        };

        return $q.when();
    });
}

export function mockUsers(userList, $q) {
    // eslint-disable-next-line jasmine/no-unsafe-spy
    spyOn(userList, 'getAll').and.returnValue(
        $q.when([
            {_id: 'user1', display_name: 'first user'},
            {_id: 'user2', display_name: 'second user'},
            {_id: 'user3', display_name: 'last user'},
        ])
    );
}

export function mockMetadata(metadata, $q) {
    // eslint-disable-next-line jasmine/no-unsafe-spy
    spyOn(metadata, 'initialize').and.callFake(() => {
        metadata.values = {
            categories: [
                {qcode: 'a', name: 'Advisories'},
                {qcode: 'b', name: 'Basketball'},
                {qcode: 'c', name: 'Cricket'},
            ],
            urgency: [
                {qcode: 1, name: 1},
                {qcode: 2, name: 2},
                {qcode: 3, name: 3},
                {qcode: 4, name: 4},
                {qcode: 5, name: 5},
            ],
            genre: [
                {qcode: 'Article', name: 'Article (news)'},
                {qcode: 'Sidebar', name: 'Sidebar'},
                {qcode: 'Factbox', name: 'Factbox'},
            ],
        };

        return $q.when();
    });
}

export function mockIngestSources(ingestSources, $q) {
    // eslint-disable-next-line jasmine/no-unsafe-spy
    spyOn(ingestSources, 'initialize').and.callFake(() => {
        ingestSources.providers = [
            {_id: 'ing1', name: 'Ingest 1'},
            {_id: 'ing2', name: 'Ingest 2'},
            {_id: 'ing3', name: 'Ingest 3'},
        ];

        return $q.when();
    });
}

export function mockSearchQuery(searchReport, $q) {
    // eslint-disable-next-line jasmine/no-unsafe-spy
    spyOn(searchReport, 'query').and.returnValue(
        $q.when({groups: {aap: 1, test: 2}})
    );
}
