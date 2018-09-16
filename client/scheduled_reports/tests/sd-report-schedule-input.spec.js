describe('sd-report-schedule-input', () => {
    let $compile;
    let $rootScope;
    let scope;
    let iscope;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.core.services.pageTitle'));
    beforeEach(window.module('superdesk.analytics'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    const getElement = (schedule, asLabel = false, submitted = false) => {
        scope = $rootScope.$new();
        scope.schedule = schedule;
        scope.asLabel = asLabel;
        scope.submitted = submitted;

        const element = $compile(`
<div sd-report-schedule-input
    ng-model="schedule"
    data-as-label="asLabel"
    data-submitted="submitted"
></div>
`)(scope);

        $rootScope.$digest();
        iscope = element.isolateScope();

        return element;
    };

    const updateSchedule = (schedule) => {
        iscope.schedule = schedule;
        iscope.updateFrequency(iscope.schedule);
        scope.$apply();
    };

    it('makes sure schedule attributes are well formed', () => {
        getElement({
            frequency: 'hourly',
            hour: 12,
            day: 9,
            week_days: ['Monday', 'Wednesday'],
        });

        expect(scope.schedule).toEqual({
            frequency: 'hourly',
            hour: -1,
            day: -1,
            week_days: [],
        });

        updateSchedule({
            frequency: 'daily',
            hour: 12,
            day: 9,
            week_days: ['Monday', 'Wednesday'],
        });
        expect(scope.schedule).toEqual({
            frequency: 'daily',
            hour: 12,
            day: -1,
            week_days: [],
        });

        updateSchedule({
            frequency: 'weekly',
            hour: 12,
            day: 9,
            week_days: ['Monday', 'Wednesday'],
        });
        expect(scope.schedule).toEqual({
            frequency: 'weekly',
            hour: 12,
            day: -1,
            week_days: ['Monday', 'Wednesday'],
        });

        updateSchedule({
            frequency: 'monthly',
            hour: 12,
            day: 9,
            week_days: ['Monday', 'Wednesday'],
        });
        expect(scope.schedule).toEqual({
            frequency: 'monthly',
            hour: 12,
            day: 9,
            week_days: [],
        });
    });
});
