import {secondsToHumanReadable} from '../utils';

describe('utils', () => {
    beforeEach(window.module('gettext'));

    it('can convert seconds to human readable string', inject((gettext, $interpolate) => {
        // Seconds
        expect(secondsToHumanReadable(1, gettext, $interpolate)).toBe('1 second');
        expect(secondsToHumanReadable(1.5, gettext, $interpolate)).toBe('1 second');
        expect(secondsToHumanReadable(10, gettext, $interpolate)).toBe('10 seconds');

        // Minutes
        expect(secondsToHumanReadable(60, gettext, $interpolate)).toBe('1 minute');
        expect(secondsToHumanReadable(90, gettext, $interpolate)).toBe('1 minute');
        expect(secondsToHumanReadable(120, gettext, $interpolate)).toBe('2 minutes');
        expect(secondsToHumanReadable(150, gettext, $interpolate)).toBe('2 minutes');

        // Hours
        expect(secondsToHumanReadable(3600, gettext, $interpolate)).toBe('1 hour');
        expect(secondsToHumanReadable(5400, gettext, $interpolate)).toBe('1 hour');
        expect(secondsToHumanReadable(7200, gettext, $interpolate)).toBe('2 hours');
        expect(secondsToHumanReadable(9000, gettext, $interpolate)).toBe('2 hours');

        // Days
        expect(secondsToHumanReadable(86400, gettext, $interpolate)).toBe('1 day');
        expect(secondsToHumanReadable(129600, gettext, $interpolate)).toBe('1 day');
        expect(secondsToHumanReadable(172800, gettext, $interpolate)).toBe('2 days');
        expect(secondsToHumanReadable(216000, gettext, $interpolate)).toBe('2 days');
    }));
});
