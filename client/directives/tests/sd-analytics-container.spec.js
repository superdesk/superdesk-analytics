describe('sd-analytics-container', () => {
    let $compile;
    let $rootScope;
    let scope;
    let $location;

    const reports = [{
        id: null,
        priority: 0,
        privileges: {},
    }, {
        id: 'report_1',
        label: 'Report 1',
        sidePanelTemplate: 'report.1.html',
        priority: 100,
        privileges: {},
    }, {
        id: 'report_2',
        label: 'Report 2',
        sidePanelTemplate: 'report.2.html',
        priority: 200,
        privileges: {},
    }, {
        id: 'report_3',
        label: 'Report 3',
        sidePanelTemplate: 'report.3.html',
        priority: 300,
        privileges: {},
    }];

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.core.services.pageTitle'));
    beforeEach(window.module('superdesk.analytics'));

    beforeEach(window.module((reportsProvider) => {
        reportsProvider.addReport(reports[1]);
        reportsProvider.addReport(reports[2]);
        reportsProvider.addReport(reports[3]);
    }));

    beforeEach(inject((_$compile_, _$rootScope_, _$location_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
        $location = _$location_;
        scope = $rootScope.$new();
    }));

    const initContainer = () => {
        // Construct the analytics container
        $compile('<div sd-analytics-container></div>')(scope);
        $rootScope.$digest();
    };

    it('default container values and functions', () => {
        initContainer();

        // Container receives the list of registered reports
        expect(scope.reports).toEqual(reports);

        // Default values
        expect(scope.flags).toEqual({showSidePanel: false});
        expect(scope.currentReport).toEqual(reports[0]);
        expect(scope.reportConfigs).toEqual({charts: []});

        // Scope functions exist
        expect(angular.isFunction(scope.changeReport)).toBeTruthy();
        expect(angular.isFunction(scope.toggleSidePanel)).toBeTruthy();
        expect(angular.isFunction(scope.changeReportParams)).toBeTruthy();

        // The URL parameter should not be set
        expect($location.search().report).toBeUndefined();
    });

    describe('changeReport', () => {
        it('changing reports', () => {
            initContainer();

            // Make sure we're working from the empty report
            expect(scope.currentReport).toEqual(reports[0]);
            expect($location.search().report).toBeUndefined();
            expect(scope.flags.showSidePanel).toBeFalsy();
            expect(scope.reportConfigs).toEqual({charts: []});

            // Change the reportConfigs so that we know it is reset when changing reports
            scope.reportConfigs = {charts: [{id: 'chart_1'}]};
            $rootScope.$digest();

            // Change to Report2
            scope.changeReport(reports[2]);
            $rootScope.$digest();
            expect(scope.currentReport).toEqual(reports[2]);
            expect($location.search().report).toBe('report_2');
            expect(scope.flags.showSidePanel).toBeTruthy();
            expect(scope.reportConfigs).toEqual({charts: []});

            // Change the reportConfigs, then attempt to change to the same report
            scope.reportConfigs = {charts: [{id: 'chart_1'}]};
            scope.flags.showSidePanel = false;
            $rootScope.$digest();
            scope.changeReport(reports[2]);
            $rootScope.$digest();
            // side-panel should still be closed, and reportConfigs should not have changed
            expect(scope.currentReport).toEqual(reports[2]);
            expect($location.search().report).toBe('report_2');
            expect(scope.flags.showSidePanel).toBeFalsy();
            expect(scope.reportConfigs).toEqual({charts: [{id: 'chart_1'}]});

            // Re-open the side-panel, then change back to the empty report
            scope.flags.showSidePanel = true;
            $rootScope.$digest();
            scope.changeReport(reports[0]);
            // side-panel should be closed, and reportConfigs should be reset
            expect(scope.currentReport).toEqual(reports[0]);
            expect($location.search().report).toBeUndefined();
            expect(scope.flags.showSidePanel).toBeFalsy();
            expect(scope.reportConfigs).toEqual({charts: []});
        });

        it('Uses the URL parameter to switch the report on load', () => {
            initContainer();
            expect(scope.currentReport).toEqual(reports[0]);

            scope = $rootScope.$new();
            $location.search('report', 'report_2');
            initContainer();
            expect(scope.currentReport).toEqual(reports[2]);
        });
    });

    it('toggleSidePanel', () => {
        const toggleFiltersSpy = jasmine.createSpy();

        initContainer();
        scope.$on('analytics:toggle-filters', toggleFiltersSpy);

        expect(scope.flags.showSidePanel).toBeFalsy();
        expect(toggleFiltersSpy.calls.count()).toBe(0);

        // Change to an actual report
        scope.changeReport(reports[2]);
        $rootScope.$digest();
        expect(scope.flags.showSidePanel).toBeTruthy();
        expect(toggleFiltersSpy.calls.count()).toBe(0);

        scope.toggleSidePanel();
        $rootScope.$digest();
        expect(scope.flags.showSidePanel).toBeFalsy();
        expect(toggleFiltersSpy.calls.count()).toBe(1);

        scope.toggleSidePanel();
        $rootScope.$digest();
        expect(scope.flags.showSidePanel).toBeTruthy();
        expect(toggleFiltersSpy.calls.count()).toBe(2);
    });

    it('changeReportParams', () => {
        initContainer();
        expect(scope.reportConfigs).toEqual({charts: []});

        scope.changeReportParams({charts: [{id: 'chart_1'}]});
        $rootScope.$digest();
        expect(scope.reportConfigs).toEqual({charts: [{id: 'chart_1'}]});

        scope.changeReportParams();
        $rootScope.$digest();
        expect(scope.reportConfigs).toEqual({charts: []});
    });
});
