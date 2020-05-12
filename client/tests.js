import 'vendor';
import 'angular-mocks';
import 'core';
import 'core/tests/mocks';
import 'apps';
import {debugInfo} from 'appConfig';

import './';

debugInfo.translationsLoaded = true; // don't print warnings about missing translations when running unit tests

var testsContext = require.context('.', true, /.spec.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
