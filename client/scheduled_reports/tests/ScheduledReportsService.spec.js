describe('scheduledReports', () => {
    let scheduledReports;
    let apiEndpoint;
    let apiMock;
    let $q;
    let $rootScope;

    beforeEach(window.module(($provide) => {
        apiEndpoint = jasmine.createSpy('api').and.callFake(() => apiMock);
        function fakeApi() {
            return apiEndpoint;
        }

        $provide.service('api', fakeApi);
        $provide.value('session', {identity: {_id: 'user1'}});
    }));

    beforeEach(window.module('superdesk.analytics.scheduled_reports'));

    beforeEach(inject((_scheduledReports_, _$q_, _$rootScope_) => {
        scheduledReports = _scheduledReports_;
        $q = _$q_;
        $rootScope = _$rootScope_;

        apiMock = {};
    }));

    it('can fetch a scheduled report by its ID', () => {
        apiMock.getById = jasmine.createSpy('api.getById').and.returnValue($q.when({saved_report: 'sr1'}));
        let schedule;

        scheduledReports.fetchById('schedule1').then((fetchedSchedule) => {
            schedule = fetchedSchedule;
        });
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('scheduled_reports');
        expect(apiMock.getById).toHaveBeenCalledWith('schedule1');
        expect(schedule).toEqual({saved_report: 'sr1'});
    });

    it('can fetch all schedules', () => {
        apiMock.getAll = jasmine.createSpy('api.getAll').and.returnValue($q.when([]));

        scheduledReports.fetchAll();
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('scheduled_reports');
        expect(apiMock.getAll).toHaveBeenCalledWith({});

        scheduledReports.fetchAll('source_category_report');
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('scheduled_reports');
        expect(apiMock.getAll).toHaveBeenCalledWith({
            where: JSON.stringify({report_type: 'source_category_report'}),
        });
    });

    it('can create a new schedule', () => {
        apiMock.save = jasmine.createSpy('api.save').and.returnValue($q.when({}));

        scheduledReports.save({saved_report: 'sr1'});
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('scheduled_reports');
        expect(apiMock.save).toHaveBeenCalledWith({}, {saved_report: 'sr1'});

        scheduledReports.save({saved_report: 'sr1'}, {name: 'schedule1'});
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('scheduled_reports');
        expect(apiMock.save).toHaveBeenCalledWith({}, {saved_report: 'sr1'});
    });

    it('can update an existing schedule', () => {
        apiMock.save = jasmine.createSpy('api.save').and.returnValue($q.when({}));

        scheduledReports.save({saved_report: 'sr1'}, {name: 'schedule1', _id: 's1'});
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('scheduled_reports');
        expect(apiMock.save).toHaveBeenCalledWith(
            {name: 'schedule1', _id: 's1'},
            {saved_report: 'sr1'}
        );
    });

    it('can delete a schedule', () => {
        apiMock.remove = jasmine.createSpy('api.remove').and.returnValue($q.when({}));

        scheduledReports.remove({_id: 'sched1'});
        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('scheduled_reports', {_id: 'user1'});
        expect(apiMock.remove).toHaveBeenCalledWith({_id: 'sched1'});
    });
});
