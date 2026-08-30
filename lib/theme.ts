/* ------------------------------------------------------------------ */
/*  The app's colour tokens.                                           */
/*                                                                      */
/*  These are CSS custom properties, not hex literals, and that is the  */
/*  whole design. 1,710 references across 76 files read T.* — almost    */
/*  always straight into an inline `style` prop — so making the VALUES  */
/*  swap at the CSS layer themes the entire app without editing a       */
/*  single component. The palettes live in app/globals.css, keyed on    */
/*  data-theme on the root element.                                     */
/*                                                                      */
/*  The shape is unchanged on purpose: every existing T.accent,         */
/*  T.textDim and so on keeps working exactly as written.               */
/*                                                                      */
/*  Note there is a SECOND, separate T in components/creator/ui.tsx     */
/*  for the creator surfaces. It carries its own tokens (purple, warn)  */
/*  and is not affected by any of this.                                 */
/* ------------------------------------------------------------------ */
export const T = {
  bg: "var(--t-bg)",
  surface: "var(--t-surface)",
  raised: "var(--t-raised)",
  line: "var(--t-line)",
  text: "var(--t-text)",
  textDim: "var(--t-text-dim)",
  textMute: "var(--t-text-mute)",
  accent: "var(--t-accent)",
  gold: "var(--t-gold)",
  deepGold: "var(--t-deep-gold)",
  success: "var(--t-success)",
  live: "var(--t-live)",
  coin: "var(--t-coin)",
} as const;

/* The literal values, for the few places a var() cannot go: the
   `themeColor` metadata export, which Next serialises into a meta tag at
   build time, and anything that has to hand a real colour to a canvas or an
   image generator. Keep these in step with the :root block in globals.css. */
export const THEME_LITERALS = {
  dark: {
    bg: "#07070E",
    accent: "#E0115F",
  },
  light: {
    bg: "#FFFFFF",
    accent: "#E0115F",
  },
} as const;

export type ThemeName = "dark" | "light";

/** The key both the boot script and the toggle read and write. */
export const THEME_STORAGE_KEY = "verza-theme";
