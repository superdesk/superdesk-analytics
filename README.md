# Superdesk Analytics
_Jan 2017_

## Overview
This is a plugin for [superdesk-client-core](https://github.com/superdesk/superdesk-client-core) and [superdesk-core](https://github.com/superdesk/superdesk-core). It adds an analytics application page with its API endpoints.

## Installation

In order to see the analytics feature in the application, you need to enable it.

### Client: Enable the superdesk-analytics module
In `client/superdesk.config.js` from `superdesk`, add this line
```js
features : {analytics: true},
```
This will import the `superdesk-analytics` node module and load the `superdesk.analytics` angular module in the main angular application.

Add the following line in the package.json file, dependencies:
```
"superdesk-analytics": "superdesk/superdesk-analytics#c7f7145"
```

Run the command:
```
npm install
```

This will install the analytics module.

### Server: Load the superdesk-analytics module
```diff
--- a/server/settings.py
+++ b/server/settings.py
@@ -132,7 +131,8 @@ INSTALLED_APPS.extend([
+    'analytics',
 ])
```

Add the following line in the requirements.txt file:
```
git+git://github.com/superdesk/superdesk-analytics.git@c7f7145#egg=superdesk-analytics
```

Run the command:
```
pip install -r requirements.txt
```

This will install the analytics package.


### Development setup

Download and install
```
git clone git@github.com:superdesk/superdesk-analytics.git
make install
```
Run the tests
```
source server/env/bin/activate
make test
```

Connect the repository to `superdesk-client-core`
```
npm link
cd /path/to/superdesk-client-core
npm link superdesk-analytics
```

Connect the repository to `superdesk-core`
```
cd /path/to/superdesk-core
source env/bin/activate
pip install -e /path/to/superdesk-analytics
```
