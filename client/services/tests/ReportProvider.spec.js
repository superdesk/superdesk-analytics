describe('reportsProvider', () => {
    let reports;

    beforeEach(window.module('superdesk.mocks'));
    beforeEach(window.module('superdesk.core.api'));
    beforeEach(window.module('superdesk.core.privileges'));
    beforeEach(window.module('superdesk.analytics.reports'));

    const addReports = (permissions, reportArray) => {
        window.module((reportsProvider) => {
            reportArray.forEach((report) => {
                reportsProvider.addReport(report);
            });
        });

        inject((privileges) => {
            privileges.setUserPrivileges(permissions);
        });

        inject((_reports_) => {
            reports = _reports_;
        });
    };

    describe('default behaviour', () => {
        beforeEach(() => {
            addReports({}, []);
        });

        it('default values', () => {
            expect(reports).toEqual([]);
        });
    });

    describe('adding a single report', () => {
        beforeEach(() => {
            addReports({}, [{
                id: 'report_1',
                label: 'Report 1',
                sidePanelTemplate: 'report.1.html',
                priority: 100,
            }]);
        });

        it('should have our test report', () => {
            expect(reports).toEqual([{
                id: null,
                priority: 0,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }, {
                id: 'report_1',
                label: 'Report 1',
                sidePanelTemplate: 'report.1.html',
                priority: 100,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }]);
        });
    });

    describe('sorts reports by priority', () => {
        beforeEach(() => {
            addReports({}, [{
                id: 'report_1',
                label: 'Report 1',
                sidePanelTemplate: 'report.1.html',
                priority: 100,
            }, {
                id: 'report_3',
                label: 'Report 3',
                sidePanelTemplate: 'report.3.html',
            }, {
                id: 'report_2',
                label: 'Report 2',
                sidePanelTemplate: 'report.2.html',
                priority: 200,
            }]);
        });

        it('sorts by priority', () => {
            expect(reports).toEqual([{
                id: null,
                priority: 0,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }, {
                id: 'report_1',
                label: 'Report 1',
                sidePanelTemplate: 'report.1.html',
                priority: 100,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }, {
                id: 'report_2',
                label: 'Report 2',
                sidePanelTemplate: 'report.2.html',
                priority: 200,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }, {
                id: 'report_3',
                label: 'Report 3',
                sidePanelTemplate: 'report.3.html',
                priority: 1000,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }]);
        });
    });

    describe('shows reports without privilege restrictions', () => {
        beforeEach(() => {
            addReports({}, [{
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
                privileges: {report_2: 1},
            }, {
                id: 'report_3',
                label: 'Report 3',
                sidePanelTemplate: 'report.3.html',
                priority: 300,
                privileges: {report_3: 1},
            }]);
        });

        it('returns the reports without restrictions', () => {
            expect(reports).toEqual([{
                id: null,
                priority: 0,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }, {
                id: 'report_1',
                label: 'Report 1',
                sidePanelTemplate: 'report.1.html',
                priority: 100,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }]);
        });
    });

    describe('shows reports with privilege restrictions', () => {
        beforeEach(() => {
            addReports({report_2: 1, report_3: 0}, [{
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
                privileges: {report_2: 1},
            }, {
                id: 'report_3',
                label: 'Report 3',
                sidePanelTemplate: 'report.3.html',
                priority: 300,
                privileges: {report_3: 1},
            }]);
        });

        it('returns the reports with restrictions', () => {
            expect(reports).toEqual([{
                id: null,
                priority: 0,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }, {
                id: 'report_1',
                label: 'Report 1',
                sidePanelTemplate: 'report.1.html',
                priority: 100,
                privileges: {},
                showSidePanel: true,
                allowScheduling: false,
            }, {
                id: 'report_2',
                label: 'Report 2',
                sidePanelTemplate: 'report.2.html',
                priority: 200,
                privileges: {report_2: 1},
                showSidePanel: true,
                allowScheduling: false,
            }]);
        });
    });
});
