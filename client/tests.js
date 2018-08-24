import 'vendor';
import 'angular-mocks';
import 'core';
import 'core/tests/mocks';
import 'apps';

import './';

var testsContext = require.context('.', true, /.spec.[j|t]sx?$/);

testsContext.keys().forEach(testsContext);
