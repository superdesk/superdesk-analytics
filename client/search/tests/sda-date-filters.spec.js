describe('sda-date-filters', () => {
    let $compile;
    let $rootScope;
    let scope;
    let element;
    let moment;

    let params;
    let form;
    let maxRange;

    beforeEach(window.module('gettext'));
    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.analytics.search'));

    beforeEach(inject((_$compile_, _$rootScope_, _moment_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        moment = _moment_;

        form = {datesError: null, submitted: true};
        params = {dates: {}};
    }));

    const compileElement = () => {
        scope = $rootScope.$new();

        scope.params = params;
        scope.form = form;
        scope.maxRange = maxRange;

        element = $compile(
            `<div sda-date-filters
                data-params="params"
                data-form="form"
                data-max-range="maxRange"
            ></div>`
        )(scope);

        $rootScope.$digest();
    };

    describe('validation', () => {
        const expectError = (msg) => {
            $rootScope.$digest();

            expect(scope.form.datesError).toBe(msg);
            expect(element.find('.sd-line-input--invalid').length).toBe(1);
            expect(element.find('.sd-line-input--invalid').html()).toContain(msg);
        };

        const expectNoError = () => {
            $rootScope.$digest();

            if (scope.form.submitted) {
                expect(scope.form.datesError).toBe(null);
            }

            expect(element.find('.sd-line-input--invalid').length).toBe(0);
        };

        it('can validate range', () => {
            params.dates.filter = 'range';

            compileElement();
            expectError('Start date is required');

            form.submitted = false;
            compileElement();
            expectNoError();

            form.submitted = true;
            params.dates.start = '01/06/2012';
            expectError('End date is required');

            params.dates.end = '30/06/2012';
            expectNoError();

            params.dates.end = '30/06/2013';
            expectError('Range cannot be greater than 72 days');

            scope.maxRange = 7;
            params.dates.end = '09/06/2012';
            expectError('Range cannot be greater than 7 days');

            params.dates.start = moment()
                .add(1, 'day')
                .format('DD/MM/YYYY');
            expectError('Start date cannot be greater than today');

            params.dates.start = moment()
                .subtract(1, 'day')
                .format('DD/MM/YYYY');
            params.dates.end = moment()
                .add(1, 'day')
                .format('DD/MM/YYYY');
            expectError('End date cannot be greater than today');
        });

        it('can validate relative_days', () => {
            params.dates.filter = 'relative_days';

            compileElement();
            expectError('Number of days is required');

            form.submitted = false;
            compileElement();
            expectNoError();

            form.submitted = true;
            params.dates.relative_days = 12;
            expectNoError();
        });

        it('can validate relative', () => {
            params.dates.filter = 'relative';

            compileElement();
            expectError('Number of hours is required');

            form.submitted = false;
            compileElement();
            expectNoError();

            form.submitted = true;
            params.dates.relative = 12;
            expectNoError();
        });

        it('can validate date', () => {
            params.dates.filter = 'day';

            compileElement();
            expectError('Date field is required');

            form.submitted = false;
            compileElement();
            expectNoError();

            form.submitted = true;
            params.dates.date = '30/06/2018';
            expectNoError();
        });
    });
});
