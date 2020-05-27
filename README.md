# Superdesk Analytics
_Jan 2017_

[![Build Status](https://travis-ci.org/superdesk/superdesk-analytics.svg?branch=master)](https://travis-ci.org/superdesk/superdesk-analytics)
[![Coverage Status](https://coveralls.io/repos/github/superdesk/superdesk-analytics/badge.svg?branch=master)](https://coveralls.io/github/superdesk/superdesk-analytics?branch=master)

## Overview
This is a plugin for [superdesk](https://github.com/superdesk/superdesk).

It adds an analytics application page with its API endpoints.

## License Notice
You must have a valid license for [Highcharts](https://www.highcharts.com/) JS v6.x to use this plugin.

The Highcharts JS library is used to render the charts. It is available under different licenses depending on whether it is intended for commercial/government use, or for a personal or non-profit project.
[see more](https://shop.highsoft.com/faq#Non-Commercial-0)


## Table of contents
* [Installation](#installation)
    * [Client](#client-enable-the-superdesk-analytics-module)
    * [Server](#server-load-the-superdesk-analytics-module)
    * [Development](#development-setup)
* [Highcharts License](#highcharts-license)
* [Config Options](#config-options)
* [Highcharts Export Server](#highcharts-export-server)
    * [Installing the Service](#installing-the-service)
    * [Running the Service](#running-the-service)
    * [Configure Process Workers](#configuring-process-workers)
    * [Rate Limiting](#rate-limiting--highcharts-requests)
* [Scheduled Reports](#scheduled-reports)
* [Archive Statistics](#archive-statistics)
* [Reports](#archive-reports)
    * [Archive Reports](#archive-reports)
        * [Content Publishing](#content-publishing)
        * [Publishing Performance](#publishing-performance)
    * [Advanced Archive Reports](#advanced-archive-reports)<sup>1</sup>
        * [Desk Activity](#desk-activity)
        * [Featuremeida Updates](#featuremedia-updates)
        * [Production Time](#production-time)
        * [Update Time](#update-time)
        * [User Activity](#user-activity)
    * [Planning Module Reports](#planning-module-reports)
        * [Planning Usage](#planning-usage)

1: These reports require [archive statistics](#archive-statistics) stats to be enabled

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
"superdesk-analytics": "superdesk/superdesk-analytics#1.5"
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
git+git://github.com/superdesk/superdesk-analytics.git@1.5#egg=superdesk-analytics
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


## Highcharts License
You must have a valid license for [Highcharts](https://www.highcharts.com/) JS v6.x to use this plugin.

The Highcharts JS library is used to render the charts. It is available under different licenses depending on whether it is intended for commercial/government use, or for a personal or non-profit project.

To have the license details available to the end user in the Analytics page of Superdesk, provide the following config options in your settings.py:

* HIGHCHARTS_LICENSE_TYPE (High-Five, Develop or OEM)
* HIGHCHARTS_LICENSEE (Name of the entity that owns the license)
* HIGHCHARTS_LICENSEE_CONTACT (A contact email address for the licensee)
* HIGHCHARTS_LICENSE_ID (The license ID provided by Highsoft)
* HIGHCHARTS_LICENSE_CUSTOMER_ID (A custom license field to use an internal customer number, if required)
* HIGHCHARTS_LICENSE_EXPIRY (the expiry of the license)


## Config Options
* HIGHCHARTS_SERVER_HOST (defaults to 'localhost')
* HIGHCHARTS_SERVER_PORT (defaults to '6060')
* HIGHCHARTS_SERVER_WORKERS (defaults to 4) - Number of workers to spawn
* HIGHCHARTS_SERVER_WORK_LIMIT (defaults to 60) - The pieces of work that can be performed before restarting a phantom process
* HIGHCHARTS_SERVER_LOG_LEVEL (defaults to 3) - Set the log level. Available options are:
* HIGHCHARTS_SERVER_QUEUE_SIZE (defaults to 10) - how many request can be stored in overflow count when there are not enough
* HIGHCHARTS_SERVER_RATE_LIMIT (defaults to False) - The max requests allowed in one minute
* ANALYTICS_ENABLE_SCHEDULED_REPORTS (defaults to False) - Enable the emailing of scheduled reports
* ANALYTICS_ENABLE_ARCHIVE_STATS (defaults to False)
* STATISTICS_MONGO_DBNAME (defaults to 'statistics')
* STATISTICS_MONGO_URI (defaults to 'mongodb://localhost/statistics')
* STATISTICS_ELASTIC_URL (defaults to ELASTICSEARCH_URL config)

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
* HIGHCHARTS_VERSION=6.2.0
* HIGHCHARTS_USE_STYLED=1
* HIGHCHARTS_MOMENT=1

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

### Configuring Process Workers
The export server uses a pool of PhantomJs worker threads. You can configure this pool in settings.py
* HIGHCHARTS_SERVER_WORKERS (defaults to 4) - Number of workers to spawn
* HIGHCHARTS_SERVER_WORK_LIMIT (defaults to 60) - The pieces of work that can be performed before restarting a phantom process
* HIGHCHARTS_SERVER_LOG_LEVEL (defaults to 3) - Set the log level. Available options are:
    * 0 - off
    * 1 - errors
    * 2 - warn
    * 3 - notice
    * 4 - verbose
* HIGHCHARTS_SERVER_QUEUE_SIZE (defaults to 10) - how many request can be stored in overflow count when there are not enough

### Rate limiting  Highcharts requests
The highcharts export server has the ability to rate limit the requests that it receives.
By default rate limiting is turned off. You can turn it on in your settings.py
* HIGHCHARTS_SERVER_RATE_LIMIT (defaults to False) - The max requests allowed in one minute


## Scheduled Reports
To enable reports to be periodically scheduled (emailed), you must enable the config in settings.py.
If this is enabled, then the celery queue entry will be created.
* ANALYTICS_ENABLE_SCHEDULED_REPORTS (defaults to False) - Enable the emailing of scheduled reports

## Archive Statistics
Archive statistics are generated from the `archive_history` collection and stored in an `archive_statistics` collection. This allows in depth reports for content, desk and user activities.

Generating these stats are disabled by default (due to resource requirements), and can be enabled in settings.py.:
* ANALYTICS_ENABLE_ARCHIVE_STATS=True

The data for archive statistics is stored in a separate mongodb database and elastic index. These can be configured with the following:
* STATISTICS_MONGO_DBNAME (defaults to 'statistics')
* STATISTICS_MONGO_URI (defaults to 'mongodb://localhost/statistics')
* STATISTICS_ELASTIC_URL (defaults to ELASTICSEARCH_URL config)

Without enabling the archive stats, the following reports will be disabled:
* [Desk Activity](#desk-activity)
* [Featuremeida Updates](#featuremedia-updates)
* [Production Time](#production-time)
* [Update Time](#update-time)
* [User Activity](#user-activity)

Statistics are generated using the following celery beat schedule:
* CELERY_BEAT_SCHEDULE\['analytics:gen_archive_stats'\]

If the above is not defined, then it will default to run at 3am every day


## Archive Reports

### Content Publishing
As an administrator I would like to be able to generate metadata reports around content publishing.

I would like to be able to group, and optionally subgroup, the report by the following metadata:
* Source
* Category
* News Value
* Genre

The report should have the ability to filter data based on the following:
* Date (yesterday, last week, last month, range)
* Desk
* User
* Published State (published, killed, corrected, recalled, rewrite/update)

I should be able to choose one of the following chart types for the report:
* Bar
* Column
* Table

### Publishing Performance
As an administrator I would like to generate a report detailing Publishing Performance.

I would like to be able to group the report by one the following:
* Desk
* User
* Category
* Source
* News Value
* Genre

Each group should be broken down to the following publish states:
* Kills
* Corrections
* Rewrites
* Updates
* Originals

## Advanced Archive Reports

### Desk Activity
As an administrator I would like to be able to analyse peak times on a desk.

This report will show the total incoming and outgoing actions on the desk, grouped by hour or by day (based on a drop down field on the form). These actions should include:

Incoming:
* Manually created by a user
* Sent to the desk (by the send to action)
* Fetched from ingested content
* Unspiked
* Duplicated
* System routed

Outgoing:
* Published
* Sent from the desk (by the send to action)
* Spiked

Below the chart should be a count of all the actions that made up this report, displayed in a table.

### Featuremedia Updates
As an administrator I would like to be able to analyse updates to story attachments.

This report will display a table of each update to stories that have asset's attached to them.

The updates will include:
* Pictures added
* Pictured removed
* Pictured altered

Links should be provided to the images and stories so the user can view the image in detail.

### Production Time
As an administrator I would like to be able to analyse time spent on stories..

This report will provide statistics on the minimum, average and maximum amount of time spent on producing stories for desks.

These figures will be calculated based on when a story enters a desk, and when that same story exits the desk.

Incoming:
* Manually created by a user
* Sent to the desk (by the send to action)
* Fetched from ingested content
* Unspiked
* Duplicated
* System routed

Outgoing:
* Published
* Sent from the desk (by the send to action)
* Spiked

### Update Time
As an administrator I would like to be able to analyse updates to 3 par stories.

I expect this report to show how long it took to create these updates.

### User Activity
This report will show a breakdown of a users workload during a single day, broken down by the individual stories that they worked on.

I expect to be able to click on any single story in the chart, that will then display a second chart displaying the life-cycle of that story, from initial creation to the last action taken on the story

## Planning Module Reports

### Planning Usage
As an administrator I would like to be able to analyse who is using Planning.

I expect this report to include the list of users who are using Planning, and a list of users who are not using Planning.

The report will include counts per user for the following actions:
* Planning items created
* Coverages created
* Coverages that are assigned to workflow? - (do we need this)
* Events created? - (do we need this)

I also expect that users who do not have permission to use Planning not to be included in this report.




