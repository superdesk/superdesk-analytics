import _ from 'lodash';
import {ReportConfigService} from '../ReportConfigService';
import {DATE_FILTERS} from '../../search/common';
import {CHART_TYPES} from '../../charts/directives/ChartOptions';
import {REPORT_CONFIG} from '../ReportConfigService';

describe('reportConfigs', () => {
    let service;
    let api;
    let $q;
    let configs;
    let config;

    beforeEach(() => {
        api = {
            getAll: jasmine.createSpy().and.returnValue(Promise.resolve(configs)),
        };
        $q = {when: (response) => Promise.resolve(response)};
        service = new ReportConfigService(api, $q, _);

        configs = [{
            _id: 'test_report',
            [REPORT_CONFIG.CHART_TYPES]: {
                [CHART_TYPES.BAR]: {enabled: true},
                [CHART_TYPES.COLUMN]: {enabled: true},
                [CHART_TYPES.TABLE]: {enabled: false},
            },
            [REPORT_CONFIG.DEFAULT_PARAMS]: {
                chart: {type: CHART_TYPES.COLUMN},
            },
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
                [DATE_FILTERS.DAY]: {enabled: false},
            },
        }, {
            _id: 'mock_report',
            [REPORT_CONFIG.CHART_TYPES]: {
                [CHART_TYPES.BAR]: {enabled: false},
                [CHART_TYPES.COLUMN]: {enabled: false},
                [CHART_TYPES.TABLE]: {enabled: true},
            },
            [REPORT_CONFIG.DEFAULT_PARAMS]: {
                chart: {type: CHART_TYPES.TABLE},
            },
            [REPORT_CONFIG.DATE_FILTERS]: {
                [DATE_FILTERS.RANGE]: {
                    enabled: false,
                    max: '72',
                },
                [DATE_FILTERS.RELATIVE_DAYS]: {
                    enabled: false,
                    max: '12',
                },
                [DATE_FILTERS.RELATIVE_HOURS]: {
                    enabled: false,
                    max: '12',
                },
                [DATE_FILTERS.DAY]: {
                    enabled: true,
                },
            },
        }];
    });

    it('defaults to empty config', () => {
        expect(service.configs).toEqual({});
    });

    it('loads the configs', (done) => {
        service.loadAll()
            .then(() => {
                expect(service.configs).toEqual({
                    test_report: configs[0],
                    mock_report: configs[1],
                });

                done();
            })
            .catch(done.fail);
    });

    it('provides filtering functionality', () => {
        service.configs = {
            test_report: configs[0],
            mock_report: configs[1],
        };

        config = service.getConfig('test_report');
        expect(config).toEqual({
            ...configs[0],
            filterEnabled: jasmine.any(Function),
            get: jasmine.any(Function),
            getAttribute: jasmine.any(Function),
            isEnabled: jasmine.any(Function),
            defaultParams: jasmine.any(Function),
        });

        expect(config.isEnabled(REPORT_CONFIG.DATE_FILTERS, DATE_FILTERS.RANGE)).toBeTruthy();
        expect(config.isEnabled(REPORT_CONFIG.DATE_FILTERS, DATE_FILTERS.DAY)).toBeFalsy();

        // Include all disabled filters
        expect(config.get(REPORT_CONFIG.DATE_FILTERS, false))
            .toEqual(configs[0][REPORT_CONFIG.DATE_FILTERS]);
        // Exclude disabled filters
        expect(config.get(REPORT_CONFIG.DATE_FILTERS)).toEqual({
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
        });

        expect(config.getAttribute(REPORT_CONFIG.DATE_FILTERS, DATE_FILTERS.RANGE))
            .toEqual({
                enabled: true,
                max: '72',
            });
        expect(config.getAttribute(REPORT_CONFIG.DATE_FILTERS, DATE_FILTERS.DAY))
            .toBeNull();
        expect(config.getAttribute(REPORT_CONFIG.DATE_FILTERS, DATE_FILTERS.DAY, false))
            .toEqual({enabled: false});

        expect(config.defaultParams()).toEqual({
            chart: {type: CHART_TYPES.COLUMN},
        });
        expect(config.defaultParams({chart: {type: CHART_TYPES.BAR}})).toEqual({
            chart: {type: CHART_TYPES.BAR},
        });
        expect(config.defaultParams({must: {something: 'todo'}})).toEqual({
            chart: {type: CHART_TYPES.COLUMN},
            must: {something: 'todo'},
        });
    });
});
