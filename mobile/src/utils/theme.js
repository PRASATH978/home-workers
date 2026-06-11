// Instagram-inspired theme
export const COLORS = {
  // Backgrounds
  bg:        '#000000',
  bgCard:    '#121212',
  bgGlass:   'rgba(255,255,255,0.05)',
  bgInput:   '#1a1a1a',

  // Instagram gradient colors
  gradStart: '#833ab4',   // purple
  gradMid:   '#fd1d1d',   // red
  gradEnd:   '#fcb045',   // gold/orange

  // Pink/Purple accent
  primary:   '#c13584',   // insta pink
  secondary: '#833ab4',   // insta purple
  accent:    '#fd1d1d',   // insta red

  // Text
  white:     '#ffffff',
  gray1:     '#efefef',
  gray2:     '#a8a8a8',
  gray3:     '#737373',
  gray4:     '#363636',

  // Status
  success:   '#00ba7c',
  error:     '#ed4956',
  warning:   '#ffad08',
  blue:      '#1877f2',
  verified:  '#0095f6',

  // Border
  border:    '#262626',
  borderLight: '#363636',
}

export const GRADIENT = {
  insta:   ['#833ab4', '#fd1d1d', '#fcb045'],
  insta2:  ['#405de6', '#5851db', '#833ab4', '#c13584', '#e1306c', '#fd1d1d'],
  purple:  ['#833ab4', '#c13584'],
  fire:    ['#fd1d1d', '#fcb045'],
  cool:    ['#405de6', '#833ab4'],
  dark:    ['#1a1a1a', '#000000'],
  success: ['#00ba7c', '#00c896'],
}

export const FONTS = {
  thin:       { fontWeight: '100' },
  light:      { fontWeight: '300' },
  regular:    { fontWeight: '400' },
  medium:     { fontWeight: '500' },
  semibold:   { fontWeight: '600' },
  bold:       { fontWeight: '700' },
  extrabold:  { fontWeight: '800' },
  black:      { fontWeight: '900' },
}

export const RADIUS = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  full: 999,
}

export const SHADOW = {
  glow: {
    shadowColor: '#c13584',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
}
