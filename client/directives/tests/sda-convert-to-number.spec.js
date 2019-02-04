describe('sda-convert-to-number', () => {
    let $compile;
    let $rootScope;
    let scope;

    beforeEach(window.module('superdesk.templates-cache'));
    beforeEach(window.module('superdesk.core.activity'));
    beforeEach(window.module('superdesk.core.services.pageTitle'));
    beforeEach(window.module('superdesk.analytics'));

    beforeEach(inject((_$compile_, _$rootScope_) => {
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    it('passes an integer into the directive', () => {
        scope = $rootScope.$new();
        scope.item = {number: 25};
        const element = $compile(
            '<form>' +
                '<input type="text" ng-model="item.number" sda-convert-to-number />' +
            '</form>'
        )(scope);

        scope.$digest();
        const input = element.find('input');

        expect(scope.item.number).toBe(25);
        expect(input[0].value).toBe('25');

        scope.item.number = 64;
        scope.$digest();
        expect(input[0].value).toBe('64');

        input.val('128').trigger('input');
        scope.$digest();
        expect(scope.item.number).toBe(128);
        expect(input[0].value).toBe('128');
    });
});
