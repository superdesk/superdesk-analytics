# Superdesk Analytics
_Jan 2017_
## Overview
This is a plugin for [superdesk-client-core](https://github.com/superdesk/superdesk-client-core) and [superdesk-core](https://github.com/superdesk/superdesk-core). It adds an analytics application page with its API endpoints.

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