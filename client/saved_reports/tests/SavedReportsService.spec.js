describe('savedReports', () => {
    let savedReports;
    let apiEndpoint;
    let apiMock;
    let $q;
    let $rootScope;

    beforeEach(window.module(($provide) => {
        apiEndpoint = jasmine.createSpy().and.callFake(() => apiMock);
        function fakeApi() {
            return apiEndpoint;
        }

        $provide.service('api', fakeApi);
        $provide.value('session', {identity: {_id: 'user1'}});
    }));

    beforeEach(window.module('superdesk.core.notify'));
    beforeEach(window.module('superdesk.analytics.saved_reports'));
    beforeEach(window.module('angularMoment'));

    beforeEach(inject((_savedReports_, _$q_, _$rootScope_) => {
        savedReports = _savedReports_;
        $q = _$q_;
        $rootScope = _$rootScope_;

        apiMock = {};
    }));

    it('can fetch a saved report by its ID', () => {
        apiMock.getById = jasmine.createSpy().and.returnValue($q.when({report: 'one'}));
        let report;

        savedReports.fetchById('report1').then((fetchedReport) => {
            report = fetchedReport;
        });
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('saved_reports');
        expect(apiMock.getById).toHaveBeenCalledWith('report1');
        expect(report).toEqual({report: 'one'});
    });

    it('can fetch all saved reports for the current user', () => {
        apiMock.query = jasmine.createSpy().and.returnValue($q.when({_items: [
            {name: 'report1', user: 'user1', is_global: false},
            {name: 'report2', user: 'user1', is_global: true},
            {name: 'report3', user: 'user2', is_global: true},
            {name: 'report4', user: 'user2', is_global: true},
        ]}));
        let reports;

        savedReports.fetchAll('source_category_report').then((fetchedReports) => {
            reports = fetchedReports;
        });
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('saved_reports');
        expect(apiMock.query).toHaveBeenCalledWith({
            max_results: 200,
            page: 1,
            where: JSON.stringify({report: 'source_category_report'}),
        });
        expect(reports).toEqual({
            user: [
                {name: 'report1', user: 'user1', is_global: false},
                {name: 'report2', user: 'user1', is_global: true},
            ],
            global: [
                {name: 'report3', user: 'user2', is_global: true},
                {name: 'report4', user: 'user2', is_global: true},
            ],
        });
    });

    it('can create a new saved report', () => {
        apiMock.save = jasmine.createSpy().and.callFake((original, updates) => $q.when({
            ...original,
            ...updates,
        }));
        let report;

        savedReports.save({name: 'test report'})
            .then((newReport) => {
                report = newReport;
            });
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('saved_reports');
        expect(apiMock.save).toHaveBeenCalledWith({}, {name: 'test report'});
        expect(report).toEqual({name: 'test report'});
    });

    it('can update an existing report', () => {
        apiMock.save = jasmine.createSpy().and.callFake((original, updates) => $q.when({
            ...original,
            ...updates,
        }));
        let report;

        savedReports.save({name: 'test report'}, {_id: 'report1', name: 'test', report: 'test_report'})
            .then((newReport) => {
                report = newReport;
            });
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('saved_reports');
        expect(apiMock.save).toHaveBeenCalledWith(
            {_id: 'report1', name: 'test', report: 'test_report'},
            {name: 'test report'}
        );
        expect(report).toEqual({_id: 'report1', name: 'test report', report: 'test_report'});
    });

    it('can remove a saved report', () => {
        apiMock.remove = jasmine.createSpy().and.returnValue($q.when({}));
        savedReports.remove({report: 'one'});

        expect(apiEndpoint).toHaveBeenCalledWith('saved_reports', {_id: 'user1'});
        expect(apiMock.remove).toHaveBeenCalledWith({report: 'one'});
    });
});
