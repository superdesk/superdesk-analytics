# Superdesk Analytics Changelog

## [2.1.1] 2021-02-26
### Fixes
- [SDESK-5839] fix(elastic): Show more than 10 entries in reports (#136)

## * Release 2.1.0 - 2021-02-11

## [2.1.0-rc.1] 2021-01-28
- Update Superdesk & Planning to release/2.1 branch

## [2.0.0] 2020-10-28
### Features

### Improvements
- elastic7 support (#129)

### Fixes
- [SDESK-5471] Minor UI issue when creating analytics report schedule. (#134)
- [SDESK-5205] fix errors after eve/flask upgrade (#124)

## [1.33.5] 2020-10-01
- Bump ui-framework version

## [1.33.4] 2020-09-17
- Release 1.33.4

## [1.33.4-rc1] 2020-09-16
### Fixes
- move jquery and gridster to dev dependencies

## [1.33.3] 2020-08-20
- Release 1.33.3

### Bugs
- Incorrect versions published to npmjs and pypi

## [1.33.2] 2020-08-19
- Release 1.33.2

## [1.33.2-rc1] 2020-08-18
### Improvements
- [SDESK-5322] Change Recall labels to Takedown (#130)
- [SDCP-271] Display desks with zero new stories in Superdesk Analytics reports (#132)
- [SDCP-270] Add ContentType filter to PublishingPerformance report. (#133)

### Fixes
- [SDESK-5392] fix: Incorrect moment import in utils (#131)

## [1.33.1] 2020-06-10
- Release 1.33.1

## [1.33.1-rc1] 2020-06-04
### Features
- [SDESK-5220] Modal to show Highcharts license (#127)

### Improvements
- [SDESK-3882] Replace ng-gettext with gettext from superdesk (#125)
- [SDESK-5276] Add group by author to Publishing Performance report (#128)

### Bugs
- [SDESK-5234] Hide Analytics menu if no reports available (#126)

## [1.33.0] 2020-04-28
- Release 1.33.0

## [1.33.0-rc1] 2020-04-22
### Fixes
- [SDESK-5133] Use appConfig instead of config/deployConfig (#121)
- [SDESK-5146] Clear filter values upon clicking the button (#122)
- fix(appConfig): Improper path used when importing appConfig (#123)

## [1.7.4] 2020-03-03
### Fixes
- fix(build): Use github/commit for highcharts export server version (#118)

## [1.7.3] 2020-01-31
### Fixes
- [SDESK-4847] Implement CSV download for tables (#113)
- [SDESK-4695] Convert relative dates to absolute for date_histogram bounds (#112)
- [SDESK-4695] (fix): Histogram aggregations failing for relative dates (#114)
- fix(install): Fix installing mkdir for highcharts-export-server (#115)
- fix(packages): Update versions based on GitHub recommendations (#116)

## [1.7.2] 2019-11-05
### Improvements
- [SDESK-4779] Add subject to publishing based reports (#111)

### Bug Fixes
- Set cores to Superdesk v1.30 (#108)
- (fix): rewritten_by was not being cleared in stats (#110)


## [1.7.1] 2019-09-16
### Bug Fixes
- (fix) flake tests (#107)
- [SDESK-4289](fix): Missing fields stored in Archive Statistics (#106)
- [SDESK-4277] Include all results for the Planning Usage Report (#105)
- fix signals import (#104)
- [SDESK-3998] Include updates for featuremedia stats (#103)


## [1.7.0] 2019-05-06
### Features
- [SDESK-3981] Provide signals for generating custom stats
- [SDESK-3947] Make user filters searchable
- Remove inactive/disabled users from the dropdown list
- [SDESK-4144] Change translations for item state
- Rearrange table heading order for PublishingPerformance report
- Add _id config schema
- [SDESK-4148] Ability to manage available date filters/chart types
- [SDESK-3799] Document 'gen_archive_statistics' command

### Bug Fixes
- (fix): Retrieve proper elastic index for statistics
- [SDESK-3947] (fix): Disabled users appearing in filters
- [SDESK-4197] (fix): Incorrect directive name for sd-report-preview-proxy
- (fix) Fixing the date histogram extended bounds parameters.
- [SDESK-4196] (fix): Cannot view schedules using the Schedule button
- [SDESK-4148] (fix): Don't import gettext from client-core
- gettext from client-core utilities is not available in 1.28
- [SDESK-3960] (fix): Etag error on patching Saved Reports
- [SDESK-4140] (fix): Don't allow saving or scheduling reports if not privileged
- [SDESK-3954] (fix): Incorrect date format in DeskActivity aggregation results
- [SDESK-4127] (fix): Export menu hidden behind table headers
- [SDESK-3938][SDESK-3958][SDESK-3957] (fix): Incorrect repo and size values
- Fix stats for removing of featuremedia


## [1.6.0] 2019-02-08
### Features
- SDESK-3799 - Cleanup and document commands in manage.py
- Generate archive stats hourly by default
- SDESK-3866 - Removed legacy reports
- SDESK-3865 - Removed legacy widgets
- SDESK-3935 - New Publishing Actions dashboard widget
- SDESK-3936 - Enhance user experience
  - Removed 'OrderBy' option for timeline based reports
  - Remove point labels (prefer tooltips instead)
  - Fix UI issue with page numbers in table reports
  - Added loading indicator while loading report and generating the chart
  - Disabled SVG/CSV in scheduled reports (currently broken)
  - Placed hour labels on top and bottom of the x-axis in the UserActivity report
  - Reduced whitespace in the chart in the UserActivity Report
  - Changed default chart types to Column or Table depending on the chart type
  - Enabled more chart types for some reports (line, area, scatter)


## [1.5.0] 2019-01-21
### Features
- SDESK-3690 - ProductionTime Report
- SDESK-3691 - User Acitivity Report
- SDESK-3692 - Featuremedia Update Report
- SDESK-3535 - Update Time Report
- (enhancement) Use superdesk-code-style for eslint config


## [1.4.0] 2019-01-03
### Features
- SDESK-3554 - Provide settings for Highcharts export server's worker pool
- SDESK-3497 - Exclude filters for ContentPublishing and PublishingPerformance reports
- SDESK-3536 - Don't validate email body text
- SDESK-3503 - Add IngestProvider and Stage to common directives/services
- SDESK-3534 - Planning Usage Report
- SDESK-3533 - Generic chart config classes
- SDESK-3694 - Command to generate/store statistics from archive history
- SDESK-3689 - Desk Activity Report

### Bug Fixes
- (fix): SearchReport tests due to change of daylight savings (use UTC instead)
- SDESK-3504 - Deselect saved report when changing report types
- SDESK-3534 - Elastic query using incorrect index for types
- SDESK-3497 - Unable to select filters with less than 3 characters


## [1.3.0] 2018-10-25
### Features
- [SDESK-3430]: Publishing Performance Report
- [SDESK-3496]: Store gettext translations with the SavedReport

### Bug Fixes
- [SDESK-3504]: (fix) Update ScheduleReports list when changing ReportType
- (fix) loading issue with Schedules and Saved reports causing recursive loop
- (fix) deselect SavedReport when changing the ReportType
- (fix) converting dates for saved reports
- (fix) converting dates for manual email of schedules
- (fix) etag issue when updating a SavedReport
- (fix) console error when viewing schedules set to hourly


## [1.2.0] 2018-10-01
### Features
- (feature): Client & Server Highcharts config generator.
- [SDESK-3183] Content Publishing Report

### Improvements
- (chore): Move functionality from SourceCategory into SavedReportsService.
- [SDESK-3319] Embed charts in the html body of scheduled report emails
- [SDESK-3320] Ability to manually email a scheduled report


## [1.1.0] 2018-09-19
### Change Log:
- [SDESK-3133] Improvements to generic Search, Scheduling and Chart functionality
- [SDESK-3382] Let the report type handle using a controller or not
- [SDESK-3384] Make sure report schedule attributes are well formed
- [SDESK-3308] (Source/Category): Show all categories and sources from the published/archived collections
- [SDESK-3301] (fix): Date filters showing 'Invalid Date'
- [SDESK-3312] (fix): Typos in form labels
- [SDESK-3308] (Source/Category): Show all categories and sources from the published/archived collections


## [1.0.0] 2018-09-06
- Initial release of the Analytics Superdesk module.
