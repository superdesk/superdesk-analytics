describe('emailReport', () => {
    let emailReport;
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
    beforeEach(window.module('superdesk.analytics.email_report'));
    beforeEach(window.module('angularMoment'));

    beforeEach(inject((_emailReport_, _$q_, _$rootScope_) => {
        emailReport = _emailReport_;
        $q = _$q_;
        $rootScope = _$rootScope_;

        apiMock = {};
    }));

    it('sets modal values', () => {
        expect(emailReport.modal).toEqual({
            report: null,
            email: null,
            open: false,
        });

        const args = {
            report: {type: 'test'},
            email: {subject: 'sending'},
        };

        emailReport.openEmailModal(args.report, args.email);
        expect(emailReport.modal).toEqual({
            report: {type: 'test'},
            email: {subject: 'sending'},
            open: true,
        });

        // Make sure that the modal does not affect the supplied report/email parameters
        args.report.type = '123';
        args.email.subject = '456';
        expect(emailReport.modal).toEqual({
            report: {type: 'test'},
            email: {subject: 'sending'},
            open: true,
        });

        emailReport.closeEmailModal();
        expect(emailReport.modal).toEqual({
            report: null,
            email: null,
            open: false,
        });
    });

    it('can send report to be emailed', () => {
        apiMock.save = jasmine.createSpy('emailReport.save').and.returnValue($q.when(undefined));

        emailReport.send(
            {
                type: 'source_category_report',
                params: {
                    dates: {
                        filter: 'range',
                        start: '01/06/2018',
                        end: '30/06/2018',
                    },
                    must: [],
                    must_not: [],
                },
                mimetype: 'image/jpeg',
                width: 1000,
            },
            {
                recipients: ['superdesk@localhost.com'],
                subject: 'Testing report emails',
                txt: {body: 'Test body'},
                html: {body: 'Test body'},
            }
        );

        $rootScope.$apply();

        expect(apiEndpoint).toHaveBeenCalledWith('email_report');
        expect(apiMock.save).toHaveBeenCalledWith(
            {},
            {
                report: {
                    type: 'source_category_report',
                    params: {
                        dates: {
                            filter: 'range',
                            start: '2018-06-01',
                            end: '2018-06-30',
                        },
                        must: [],
                        must_not: [],
                    },
                    mimetype: 'image/jpeg',
                    width: 1000,
                },
                email: {
                    recipients: ['superdesk@localhost.com'],
                    subject: 'Testing report emails',
                    txt: {body: 'Test body'},
                    html: {body: 'Test body'},
                },
            }
        );
    });
});
