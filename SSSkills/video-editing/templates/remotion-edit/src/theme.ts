// Design system for "The 24-Hour Man" — v2: CINEMATIC.
// Clean type, no gradients, no boxed panels on footage: white type + soft shadow.
// Display = Bebas Neue (all caps, tracked). Body/UI = Inter. Subtitles = Arimo Bold (Helvetica metrics).
import {loadFont as loadInter} from '@remotion/google-fonts/Inter';
import {loadFont as loadSerif} from '@remotion/google-fonts/SourceSerif4';
import {loadFont as loadMono} from '@remotion/google-fonts/JetBrainsMono';
import {loadFont as loadBebas} from '@remotion/google-fonts/BebasNeue';
import {loadFont as loadArimo} from '@remotion/google-fonts/Arimo';

export const inter = loadInter('normal', {weights: ['300', '400', '500', '600', '700', '800'], subsets: ['latin']});
export const serif = loadSerif('normal', {weights: ['400', '600', '700'], subsets: ['latin']});
export const mono = loadMono('normal', {weights: ['400', '700'], subsets: ['latin']});
export const bebas = loadBebas('normal', {weights: ['400'], subsets: ['latin']});
export const arimo = loadArimo('normal', {weights: ['400', '700'], subsets: ['latin']});

export const FONT_DISPLAY = bebas.fontFamily; // names, titles, big statements, kickers — ALL CAPS
export const FONT_SANS = inter.fontFamily; // UI, roles, small labels, emails
export const FONT_SUB = arimo.fontFamily; // subtitles (Helvetica-metric bold)
export const FONT_SERIF = serif.fontFamily; // legacy — avoid in new work
export const FONT_MONO = mono.fontFamily; // clocks / timers only

// Text shadows: no boxes, no gradients — legibility comes from shadow alone.
export const SHADOW = {
  hero: '0 2px 3px rgba(0,0,0,0.55), 0 6px 18px rgba(0,0,0,0.45), 0 18px 48px rgba(0,0,0,0.35)',
  text: '0 1px 2px rgba(0,0,0,0.6), 0 4px 14px rgba(0,0,0,0.45)',
  sub: '0 0 2px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.85), 0 3px 12px rgba(0,0,0,0.55)',
  card: '0 30px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)',
};

// Palette: near-black, off-white, ONE warm accent (amber) + alert red. Key names kept for compatibility.
export const C = {
  ink: '#0A0A0B', // backgrounds (solid, never gradient)
  inkSoft: '#161618', // raised dark surfaces
  teal: '#E2A93B', // legacy key -> now the AMBER accent (kickers, rules, highlights)
  tealBright: '#F1C26A', // lighter amber for small text on footage
  accent: '#E2A93B',
  paper: '#FFFFFF',
  paperDim: '#F4F4F2',
  line: '#E3E3E0',
  text: '#111113',
  textDim: '#7A7A80',
  alert: '#E0483E', // red (skipped, empty CC ring, failure)
  warm: '#E9A15B', // replay accent
  white: '#FFFFFF',
  uiBlue: '#2F6FEB', // mail/phone UI buttons (generic, unbranded)
};

export const FPS = 30;
export const W = 1920;
export const H = 1080;

// Grades applied as CSS filters on footage.
export const GRADES: Record<string, string> = {
  none: 'none',
  // Reality: cool, slightly desaturated (script colour key)
  cool: 'saturate(0.82) contrast(1.06) brightness(0.98) hue-rotate(-4deg)',
  // Night scenes: cooler + a touch darker
  night: 'saturate(0.8) contrast(1.08) brightness(0.92) hue-rotate(-8deg)',
  // "What if" replays: warm and soft
  warm: 'sepia(0.22) saturate(1.12) contrast(0.95) brightness(1.05)',
};

export const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
export const easeInOutCubic = (t: number) => {
  t = Math.min(Math.max(t, 0), 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * Math.max(t, 0)));
