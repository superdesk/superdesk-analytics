import 'vendor';
import 'angular-mocks';
import 'core';
import 'core/tests/mocks';
import 'apps';
import {debugInfo, appConfig} from 'appConfig';
import {superdeskApi} from 'superdeskApi';

import './';

const testConfig = {
    model: {
        timeformat: 'HH:mm:ss',
        dateformat: 'DD/MM/YYYY',
    },
    view: {
        timeformat: 'HH:mm',
        dateformat: 'MM/DD/YYYY',
    },
    features: {
        editFeaturedImage: true,
    },
    search: {
        useDefaultTimezone: true,
    },
    default_timezone: 'Europe/London',
    server: {
        url: 'http://localhost:5000',
        ws: undefined,
    },
};

beforeEach(() => { // reset config before each test
    Object.assign(appConfig, testConfig);
});

// mock superdeskApi
superdeskApi.localization = {
    gettext: (key) => key,
};

debugInfo.translationsLoaded = true; // don't print warnings about missing translations when running unit tests

var testsContext = require.context('client', true, /.spec.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
