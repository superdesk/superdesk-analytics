import {gettext} from '../../utils';

ChartColourPicker.$inject = [];


export const CHART_COLOURS = {
    BLACK: 'sda-black',
    GRAY_DARKER: 'sda-gray-darker',
    GRAY_DARK: 'sda-gray-dark',
    GRAY_MEDIUM: 'sda-gray-medium',
    GRAY: 'sda-gray',
    GRAY_NEUTRAL: 'sda-gray-neutral',
    GRAY_TEXT: 'sda-gray-text',
    GRAY_LIGHT: 'sda-gray-light',
    GRAY_LIGHTER: 'sda-gray-lighter',
    WHITE: 'sda-white',
    BLUE: 'sda-blue',
    BLUE_MEDIUM: 'sda-blue-medium',
    BLUE_DARK: 'sda-blue-dark',
    GREEN: 'sda-green',
    RED: 'sda-red',
    YELLOW: 'sda-yellow',
    ORANGE: 'sda-orange',
    PURPLE: 'sda-purple',
    FERN_GREEN: 'sda-fern-green',
    OLD_GOLD: 'sda-old-gold',
    DARK_ORNGE: 'sda-dark-orange',
    FIRE_BRICK: 'sda-fire-brick',
    DEEP_PINK: 'sda-deep-pink',
    DARK_MAGENTA: 'sda-dark-magenta',
    DARK_VIOLET: 'sda-dark-violet',
    NAVY: 'sda-navy',
};

export function ChartColourPicker() {
    return {
        scope: {
            field: '=',
            label: '=',
        },
        replace: true,
        transclude: true,
        template: require('../views/chart-colour-picker.html'),
        link: function(scope) {
            scope.colours = [
                {name: gettext('Black'), colour: CHART_COLOURS.BLACK},
                {name: gettext('Dark Gray'), colour: CHART_COLOURS.GRAY_DARK},
                {name: gettext('Darker Gray'), colour: CHART_COLOURS.GRAY_DARKER},
                {name: gettext('Medium Gray'), colour: CHART_COLOURS.GRAY_MEDIUM},
                {name: gettext('Gray'), colour: CHART_COLOURS.GRAY},
                {name: gettext('Neutral Gray'), colour: CHART_COLOURS.GRAY_NEUTRAL},
                {name: gettext('Gray Text'), colour: CHART_COLOURS.GRAY_TEXT},
                {name: gettext('Light Gray'), colour: CHART_COLOURS.GRAY_LIGHT},
                {name: gettext('Lighter Gray'), colour: CHART_COLOURS.GRAY_LIGHTER},
                {name: gettext('White'), colour: CHART_COLOURS.WHITE},
                {name: gettext('Blue'), colour: CHART_COLOURS.BLUE},
                {name: gettext('Medium Blue'), colour: CHART_COLOURS.BLUE_MEDIUM},
                {name: gettext('Dark Blue'), colour: CHART_COLOURS.BLUE_DARK},
                {name: gettext('Green'), colour: CHART_COLOURS.GREEN},
                {name: gettext('Red'), colour: CHART_COLOURS.RED},
                {name: gettext('Yellow'), colour: CHART_COLOURS.YELLOW},
                {name: gettext('Orange'), colour: CHART_COLOURS.ORANGE},
                {name: gettext('Purple'), colour: CHART_COLOURS.PURPLE},
                {name: gettext('Fern Green'), colour: CHART_COLOURS.FERN_GREEN},
                {name: gettext('Old Gold'), colour: CHART_COLOURS.OLD_GOLD},
                {name: gettext('Dark Orange'), colour: CHART_COLOURS.DARK_ORNGE},
                {name: gettext('Fire Brick'), colour: CHART_COLOURS.FIRE_BRICK},
                {name: gettext('Deep Pink'), colour: CHART_COLOURS.DEEP_PINK},
                {name: gettext('Dark Magenta'), colour: CHART_COLOURS.DARK_MAGENTA},
                {name: gettext('Dark Violet'), colour: CHART_COLOURS.DARK_VIOLET},
                {name: gettext('Navy'), colour: CHART_COLOURS.NAVY},
            ];
        },
    };
}
