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


## Highcharts Export Server
To be able to generate charts on the server, we need to install/run the Highcharts Export Server.

### Installing the service
```
npm install -g highcharts-export-server
```

There is also a script that can be used to automate the install:
```
cd server/scripts && ./install-highcharts-export-server.sh
```
This will automatically accept the end user licence, and use a specific version of highcharts
* ACCEPT_HIGHCHARTS_LICENSE=1
* HIGHCHARTS_VERSION=6.1.1
* HIGHCHARTS_USE_STYLED=1

### Running the service
There is a python module to allow running the highcharts export server.
```
python3 -u -m analytics.reports.highcharts_server
```

This will start the service using the host/port configured in settings.py (relative to your current working directory)
* HIGHCHARTS_SERVER_HOST (defaults to 'localhost')
* HIGHCHARTS_SERVER_PORT (defaults to '6060')

### Adding the service to a Honcho Procfile
You can add the service to your Honcho Procfile with the following line:
```
highcharts: python3 -u -m analytics.reports.highcharts_server
```
