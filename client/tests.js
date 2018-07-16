import 'vendor';
import 'angular-mocks';
import 'core';
import 'core/tests/mocks';
import 'apps';

import './';

var testsContext = require.context('.', true, /.spec.jsx?$/);

testsContext.keys().forEach(testsContext);
