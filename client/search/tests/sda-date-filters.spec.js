import _ from 'lodash';
import {ReportConfigService} from '../../services';
import {DATE_FILTERS} from '../common';
import {REPORT_CONFIG} from '../../services/ReportConfigService';

describe('sda-date-filters', () => {
    let $compile;
    let $rootScope;
    let scope;
    let $q;
    let element;
    let moment;

    let params;
    let form;
    let config;
    let reportConfigs;

    beforeEach(window.module('gettext'));
    beforeEach(window.module('angularMoment'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.analytics.search'));

    beforeEach(inject((_$compile_, _$rootScope_, _moment_, _$q_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        moment = _moment_;
        $q = _$q_;

        reportConfigs = new ReportConfigService({}, $q, _);

        reportConfigs.configs = {
            test_report: {
                _id: 'test_report',
                [REPORT_CONFIG.DATE_FILTERS]: {
                    [DATE_FILTERS.RANGE]: {
                        enabled: true,
                        max: '72',
                    },
                    [DATE_FILTERS.RELATIVE_DAYS]: {
                        enabled: true,
                        max: '12',
                    },
                    [DATE_FILTERS.RELATIVE_HOURS]: {
                        enabled: true,
                        max: '12',
                    },
                    [DATE_FILTERS.DAY]: {
                        enabled: true,
                    },
                },
            },
        };

        config = reportConfigs.getConfig('test_report');
    }));

    beforeEach(() => {
        form = {
            datesError: null,
            submitted: true,
            showErrors: true,
        };
        params = {dates: {}};
    });

    const compileElement = () => {
        scope = $rootScope.$new();

        scope.params = params;
        scope.form = form;
        scope.config = config;

        element = $compile(
            `<div sda-date-filters
                data-params="params"
                data-form="form"
                data-config="config"
            ></div>`
        )(scope);

        $rootScope.$digest();
    };

    describe('validation', () => {
        const expectError = (msg) => {
            $rootScope.$digest();

            expect(scope.form.datesError).toBe(msg);
            expect(element.find('.sd-line-input__message').length).toBe(1);
            expect(element.find('.sd-line-input__message').html()).toContain(msg);
        };

        const expectNoError = () => {
            $rootScope.$digest();

            if (scope.form.submitted) {
                expect(scope.form.datesError).toBe(null);
            }

            expect(element.find('.sd-line-input__message').length).toBe(0);
        };

        it('can validate range', () => {
            params.dates.filter = DATE_FILTERS.RANGE;

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

            config.date_filters[DATE_FILTERS.RANGE].max = '7';
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
            params.dates.filter = DATE_FILTERS.RELATIVE_DAYS;

            compileElement();
            expectError('Relative value is required');

            form.submitted = false;
            compileElement();
            expectNoError();

            form.submitted = true;
            params.dates.relative = 12;
            expectNoError();
        });

        it('can validate relative_hours', () => {
            params.dates.filter = DATE_FILTERS.RELATIVE_HOURS;

            compileElement();
            expectError('Relative value is required');

            form.submitted = false;
            compileElement();
            expectNoError();

            form.submitted = true;
            params.dates.relative = 12;
            expectNoError();
        });

        it('can validate date', () => {
            params.dates.filter = DATE_FILTERS.DAY;

            compileElement();
            expectError('Date field is required');

            form.submitted = false;
            compileElement();
            expectNoError();

            form.submitted = true;
            params.dates.date = '30/06/2018';
            expectNoError();
        });

        it('only shows selection for configured date filters', () => {
            const getFilter = (value) => (
                element.find(`option[value="${value}"]`).length
            );

            config.date_filters = {
                [DATE_FILTERS.RANGE]: {enabled: true},
                [DATE_FILTERS.DAY]: {enabled: false},
                [DATE_FILTERS.RELATIVE_HOURS]: {enabled: true},
                [DATE_FILTERS.RELATIVE_DAYS]: {enabled: true},
            };
            compileElement();

            expect(getFilter(DATE_FILTERS.RANGE)).toBe(1);
            expect(getFilter(DATE_FILTERS.DAY)).toBe(0);
            expect(getFilter(DATE_FILTERS.RELATIVE_HOURS)).toBe(1);
            expect(getFilter(DATE_FILTERS.RELATIVE_DAYS)).toBe(1);
            expect(getFilter(DATE_FILTERS.LAST_YEAR)).toBe(0);
        });
    });
});
