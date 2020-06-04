import {secondsToHumanReadable} from '../utils';

describe('utils', () => {
    it('can convert seconds to human readable string', () => {
        // Seconds
        expect(secondsToHumanReadable(1)).toBe('1 second');
        expect(secondsToHumanReadable(1.5)).toBe('1 second');
        expect(secondsToHumanReadable(10)).toBe('{{seconds}} seconds');

        // Minutes
        expect(secondsToHumanReadable(60)).toBe('1 minute');
        expect(secondsToHumanReadable(90)).toBe('1 minute');
        expect(secondsToHumanReadable(120)).toBe('{{minutes}} minutes');
        expect(secondsToHumanReadable(150)).toBe('{{minutes}} minutes');

        // Hours
        expect(secondsToHumanReadable(3600)).toBe('1 hour');
        expect(secondsToHumanReadable(5400)).toBe('1 hour');
        expect(secondsToHumanReadable(7200)).toBe('{{hours}} hours');
        expect(secondsToHumanReadable(9000)).toBe('{{hours}} hours');

        // Days
        expect(secondsToHumanReadable(86400)).toBe('1 day');
        expect(secondsToHumanReadable(129600)).toBe('1 day');
        expect(secondsToHumanReadable(172800)).toBe('{{days}} days');
        expect(secondsToHumanReadable(216000)).toBe('{{days}} days');
    });
});
