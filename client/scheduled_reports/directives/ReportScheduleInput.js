ReportScheduleInput.$inject = ['gettext', 'lodash'];

/**
 * @ngdoc directive
 * @module superdesk.apps.analytics.scheduled_reports
 * @name sdaReportScheduleInput
 * @requires gettext
 * @requires lodash
 * @description A directive that renders either the input or the label for the scheduling details
 */
export function ReportScheduleInput(gettext, _) {
    return {
        scope: {
            asLabel: '=',
            schedule: '=ngModel',
            submitted: '=',
        },
        require: 'ngModel',
        template: require('../views/report-schedule-input.html'),
        link: function(scope, element, attr, ngModel) {
            /**
             * @ngdoc method
             * @name sdaReportScheduleInput#initAsInput
             * @description Initializes this directive as input fields
             */
            this.initAsInput = () => {
                scope.weekdayError = null;

                scope.frequencies = [{
                    label: gettext('Hourly'),
                    value: 'hourly',
                }, {
                    label: gettext('Daily'),
                    value: 'daily',
                }, {
                    label: gettext('Weekly'),
                    value: 'weekly',
                }, {
                    label: gettext('Monthly'),
                    value: 'monthly',
                }];

                scope.resetWeekdays();
                (scope.schedule.week_days || []).forEach((day) => {
                    scope.weekdays[day] = true;
                });

                scope.updateFrequency(scope.schedule);
                scope.onWeekdayChange();
            };

            /**
             * @ngdoc method
             * @name sdaReportScheduleInput#initAsInput
             * @description Initializes this directive as a read-only label
             */
            this.initAsLabel = () => {
                const frequency = _.get(scope.schedule, 'frequency');

                if (frequency === 'hourly') {
                    scope.label = gettext('Hourly');
                } else {
                    const hour = scope.hours[_.get(scope.schedule, 'hour')].label;

                    if (frequency === 'daily') {
                        scope.label = gettext('Daily at ') + hour;
                    } else if (frequency === 'weekly') {
                        const days = _.get(scope.schedule, 'week_days');

                        scope.label = gettext('Weekly on ') + days.join(', ') + gettext(' at ') + hour;
                    } else if (frequency === 'monthly') {
                        const day = scope.days[_.get(scope.schedule, 'day') - 1].label;

                        scope.label = gettext('Monthly on the ') + day + gettext(' day at ') + hour;
                    }
                }
            };

            /**
             * @ngdoc method
             * @name sdaReportScheduleInput#updateFrequency
             * @param {Object} schedule - The updated schedule
             * @description Updates the schedule values when the frequency changes
             */
            scope.updateFrequency = (schedule) => {
                if (schedule.frequency === 'hourly') {
                    scope.flags = {
                        showHour: false,
                        showDay: false,
                        showWeekDay: false,
                    };

                    schedule.hour = -1;
                    schedule.day = -1;
                    schedule.week_days = [];
                    scope.resetWeekdays();
                } else if (schedule.frequency === 'daily') {
                    scope.flags = {
                        showHour: true,
                        showDay: false,
                        showWeekDay: false,
                    };

                    schedule.day = -1;
                    schedule.week_days = [];
                    scope.resetWeekdays();

                    if (_.get(schedule, 'hour', -1) < 0) {
                        schedule.hour = 0;
                    }
                } else if (schedule.frequency === 'weekly') {
                    scope.flags = {
                        showHour: true,
                        showDay: false,
                        showWeekDay: true,
                    };

                    schedule.day = -1;
                    (scope.schedule.week_days || []).forEach((day) => {
                        scope.weekdays[day] = true;
                    });
                    scope.onWeekdayChange();
                    if (_.get(schedule, 'hour', -1) < 0) {
                        schedule.hour = 0;
                    }
                } else if (schedule.frequency === 'monthly') {
                    scope.flags = {
                        showHour: true,
                        showDay: true,
                        showWeekDay: false,
                    };

                    schedule.week_days = [];
                    scope.resetWeekdays();

                    if (_.get(schedule, 'hour', -1) < 0) {
                        schedule.hour = 0;
                    }

                    if (_.get(schedule, 'day', -1) < 1) {
                        schedule.day = 1;
                    }
                }
            };

            /**
             * @ngdoc method
             * @name sdaReportScheduleInput#onWeekdayChange
             * @description Validates input when the week days change
             */
            scope.onWeekdayChange = () => {
                if (scope.flags.showWeekDay) {
                    scope.schedule.week_days = Object.keys(scope.weekdays)
                        .filter((day) => !!scope.weekdays[day]);

                    if (scope.schedule.week_days.length < 1) {
                        ngModel.$setValidity('weekDayRequired', false);
                        scope.weekdayError = gettext('Must select at least one day');
                    } else {
                        ngModel.$setValidity('weekDayRequired', true);
                        scope.weekdayError = null;
                    }
                } else {
                    ngModel.$setValidity('weekDayRequired', true);
                    scope.weekdayError = null;
                }
            };

            /**
             * @ngdoc method
             * @name sdaReportScheduleInput#resetWeekdays
             * @description Turns all weekday selections off
             */
            scope.resetWeekdays = () => {
                scope.weekdays = {
                    Monday: false,
                    Tuesday: false,
                    Wednesday: false,
                    Thursday: false,
                    Friday: false,
                    Saturday: false,
                    Sunday: false,
                };
            };

            /**
             * @ngdoc property
             * @name sdaReportScheduleInput#hours
             * @type {Array}
             * @description Provides array of values for use with select dropdowns
             */
            scope.hours = _.range(0, 24)
                .map((hour) => {
                    let label;

                    if (hour === 0) {
                        label = gettext('12:00am');
                    } else if (hour < 12) {
                        label = hour + gettext(':00am');
                    } else if (hour > 12) {
                        label = (hour - 12) + gettext(':00pm');
                    } else {
                        label = hour + gettext(':00pm');
                    }

                    return {
                        label: label,
                        value: hour,
                    };
                });

            /**
             * @ngdoc property
             * @name sdaReportScheduleInput#days
             * @type {Array}
             * @description Provides array of values for use with select dropdowns
             */
            scope.days = _.range(1, 30)
                .map((d) => {
                    let label;

                    if (d === 1) {
                        label = gettext('first');
                    } else if (d >= 29) {
                        label = gettext('last');
                    } else {
                        label = '' + d;
                    }

                    return {
                        label: label,
                        value: d,
                    };
                });

            if (scope.asLabel) {
                this.initAsLabel();
            } else {
                this.initAsInput();
            }
        },
    };
}
