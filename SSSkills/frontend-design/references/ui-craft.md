# UI craft reference

Concrete values and patterns distilled from the full video catalogues of two UI/UX design channels: @juxtopposed (J-01…J-44) and @kolejain (K-01…K-54). Video ids are kept so a rule can be traced. Numbers here are starting points that make a rule testable, not laws: the brief and the subject still win, and SKILL.md's warnings about defaults still apply. For charts and data visualization, the `dataviz` skill takes precedence where it is available.

## Contents
1. Typography
2. Color systems
3. Dark mode
4. Spacing, layout, containers
5. Components and states
6. Icons and imagery
7. Interaction and motion
8. Information architecture and flows
9. Dashboards and data
10. Mobile
11. Landing pages and marketing sites
12. Review checklist

## 1. Typography

- **Scale.** Start from a 16px base (18px for reading-heavy pages). Pick one ratio: about 1.17–1.2 for dense UI (dashboards, mobile, tools), about 1.25–1.27 for general sites, wider only for editorial pages with two or three levels. The golden ratio (1.618) grows too fast beyond two levels. [K-42, J-33, J-38]
- **Counts.** At most about 6 sizes on a landing page. Dashboard text rarely exceeds 24px, with sizes closer together. [K-09, K-17]
- **Fluid sizing.** Use `clamp()` (a linear ramp between roughly 320px and 1920px viewports, capped both ends) instead of breakpoint-by-breakpoint overrides. Don't shrink type on mobile; mobile bases are often larger (iOS 17px vs macOS 13px). [K-42, K-08]
- **Line-height.** About 150% for body, 110–130% for headings (110–120% for large display). Increase it as text gets smaller or lines get longer. [K-42, K-09]
- **Tracking.** Tighten as size grows: −2% to −3% for large headings, −2% to −4% above about 70px. Small text needs relatively more spacing, not less. [K-09, K-26, K-42]
- **Weights.** Two weights at least one step apart (400/600). Avoid ultra-thin or ultra-bold in running text. Don't make dense section headings extra bold. Express weights as numbers. [K-42, K-45, J-04, J-05]
- **Text tones.** Two tones cover most needs: primary, and the same color at 45–70% opacity. Body stays at full strength; the smallest text should not also be the faintest. Light-mode reference lightness: headings about 11%, body 15–20%, subtext 30–40%. [K-42, K-45, K-11, K-05]
- **Measure.** Under 80 characters per line. Cap reading columns around 680–800px of text (container up to about 1000px), even on wide screens. [J-21, J-24]
- **Consistency.** Each text role has one size across every screen. Page titles stay a fixed size whatever their length; don't scale titles to fit. [J-09, J-23]
- **Families.** One family, or two that clearly contrast (display + sans, serif + sans). A third only for code or captions. Judge candidate faces in the real layout, not a specimen; test three or more. A custom display face must align to the baseline and grid of its neighbours. [K-42, J-07, J-19]
- **Display type.** Giant type once, at most twice, per page, for short statements. The contrast between huge display type and small navigation text is what makes it feel important. No scroll-driven moving headline text. [K-45, K-50, J-42]
- **Icons with text.** Icon size equals the line-height of adjacent text (e.g. 24px icon with 24px line-height). [K-09]
- **Accessibility.** Offer a text-size control on reading-heavy surfaces. [J-23, J-24]

## 2. Color systems

- **Roles, not hues.** Name tokens by purpose: background, surface layers, border, text (primary/secondary/tertiary), primary, accent, success, warning, danger, info, disabled. Each gets shades and transparent variants. [J-35, J-38, J-39]
- **Ramps in OKLCH.** Generate tints and shades in OKLCH: it holds hue and perceived lightness steady. HSL lightening drifts (blue toward violet, the Abney effect). If you must work in HSB, each darker step: saturation +20, brightness −10, hue shifted about 20° toward blue/purple. [J-20, K-26]
- **Accent ramp usage (50–950 scale).** Light mode: 500/600 for the main fill, 700 for hover, 400/500 for links, 50 for tinted backgrounds. Dark mode: 300/400 for fills, 400/500 for hover, 950 for a brand-tinted background. [K-11, K-26, K-44]
- **Proportions.** Product UI is mostly neutral, close to 90/8/2. 60-30-10 suits marketing pages. A product needs about 4 background layers, 1–2 border colors and about 3 text colors. Keep palettes small: a real app collapsed 41 color styles to 2 text, 5 background, 2 brand and 3 accent. [K-11, K-16, J-43, J-32]
- **Light-mode neutrals.** Background 98–100% lightness; frame or sidebar slightly darker or brand-tinted (about 2%); card edges a border near 85% lightness. Tint neutrals with the brand hue (in OKLCH: L −0.03, C +0.02, brand hue). [K-11]
- **Button emphasis by darkness.** Ghost → light grey fill (90–95%) → solid dark or brand fill. The more important the action, the darker or more saturated it is. [K-11]
- **Semantic colors are fixed.** Red destructive, green success, amber warning, blue info. Each color has one meaning across the app (if green means "added", only added things are green). Never rely on color alone: pair with an icon or text. [K-09, K-16, J-04, J-33]
- **Defaults in grey.** Show default values in grey so that non-default values stand out; emphasis is contrast with neighbours. [K-03]
- **Where color goes.** On dashboards, color comes from data and status, not decorative colored buttons or icon tiles. Icons stay uncolored unless they show status. Accent pops can be held back for interaction (a bright CTA color revealed on hover). [K-06, K-10, K-16, K-37]
- **Content-derived color.** Take accents from the content where it has color: album art tints the player, a hero photo seeds a theme. A content page with no color reads as soulless. [J-06, J-03]
- **Gradients.** Either none, or within one hue (light to dark of the same color). Avoid two-hue gradients like blue→green. A good design stays good with the gradient removed. White text on gradients often fails contrast; check it. [K-22, K-45, J-05]
- **Muted over saturated.** Muted hues (baby blue, beige, lavender), off-white light modes, and brand-tinted darks signal experience; fully saturated primaries plus black and white don't. [K-45, K-32]
- **Chart palettes.** In OKLCH, fix lightness and chroma, step hue about 25–30°. Never neutrals only or steps of one brand ramp. [K-11]
- **Choosing a palette.** Check: does it fit the industry, fit the purpose, work on both light and dark, avoid being too light or oversaturated, harmonize with its neighbours, and contrast enough? Judge colors in a realistic UI (a dashboard and an article) on more than one device, not as swatches. Derive from the brand, logo or product. [J-20, J-43, J-39]
- **Contrast.** AA: 4.5:1 body, 3:1 large text, 3:1 icons and component edges (4.5:1 for thin icons). If a brand color fails with white text, darken it rather than accept it. [J-39, K-16]
- **States by color.** Hover slightly lighter/brighter, pressed slightly darker, disabled desaturated with reduced contrast. On touch, use a pressed state instead of hover. [K-16]

## 3. Dark mode

- Design it as its own theme, never an inverted light theme. Ship light and dark tokens together under `prefers-color-scheme`, and let users choose (Light / Dim / Dark, plus an accent picker in apps). [J-35, K-11, J-14, J-17]
- **Surface steps.** About twice the light-mode gap: where light layers differ by 2%, dark layers differ by 4–6%. In HSB, each raised layer is about +4–6 brightness and −10–20 saturation. Lighter means higher. [K-11, K-26, K-44]
- **Elevation.** Shadows barely read on dark; use lighter surfaces, a subtle low-contrast border, or a faint gradient instead. [J-35, K-09]
- **Accents.** Lighten and desaturate; vivid accents glare on dark. Fix failing brand colors by raising lightness or lowering saturation, never by adding saturation. [J-35, K-44]
- **Text.** Avoid pure white on pure black (halation, hard for people with astigmatism). Body is light grey; save the brightest white for the most important text. Lower border contrast; desaturate chips and logos. [J-35, K-09, K-16]
- **Backgrounds.** Dark can be a deep brand tint (navy, plum, forest), optionally two brand colors pushed very dark with light noise. [K-09, K-39, K-45]
- **Effects.** Dark tolerates glows and blurs that light mode doesn't, but keep text-heavy views plain; reserve atmosphere for landing pages. [J-35]
- **Everything themed.** Illustrations, hero art, embeds and third-party surfaces get dark versions. No light pages flashing inside a dark app. [J-03, J-25]

## 4. Spacing, layout, containers

- **Grid.** 4px base (8px for looser marketing pages). Strict in forms, modals, tables and dashboards; looser on landing pages. For large values, step exponentially or round to 5/10 (120 vs 128 is indistinguishable). Use 12/8/4 columns for structured pages. [K-09, K-17, K-26, K-41]
- **Proximity.** Example hero: eyebrow 12px above heading, subtext 8px below heading, buttons 32px below subtext. The gap before buttons is at least twice the heading-to-subtext gap. About 32px between unrelated items. [K-05, K-09, K-04]
- **Too tight is the beginner error.** Increase vertical space between stacked groups, especially on mobile. Separate list rows with space; if they must be tight, zebra-stripe before adding rules. [K-22, K-45, K-26]
- **Edges.** Align to edges; in compact UI, every element should touch at least two alignment edges. Keep dividers inside the content column. Misalignment is the fastest way to look amateur. [K-03, J-19]
- **Containers.** No borders on borders, no cards in cards, no padding on padding. Don't wrap already-distinct items in cards; cards inflate the footprint of multi-column grids. Separate adjacent panels clearly. A tinted low-opacity fill can separate regions instead of a line. [K-03, K-26, J-04, J-05, K-41]
- **Radii.** One radius language across images, buttons and containers, chosen to suit the subject (a blocky game wants sharp corners). Nested: inner = outer − padding (pills exempt). Related elements share radii. [K-07, K-26, J-11, J-03]
- **Shadows.** Low opacity, high blur. Weakest on cards, stronger on popovers and menus. Recipe: x ≤ y, blur 1.3–2× y, opacity 15–20% (or a light grey shadow with large blur). If the shadow is the first thing you notice, it's wrong. [K-09, K-45]
- **Layouts.** Let the content choose: one statement → centered, large, spacious; many features → grid or bento (only with enough content to fill it; expect people to notice only one or two cells); 3–5 detailed steps → stacked sliding cards; 3–10 items → horizontal carousel with position indicator. Mix full-bleed, multi-column, stacked and image interlude sections; don't repeat image-left/text-right. Break the box occasionally (overlaps, bleeds, offset cards). [K-05, K-07, K-50, K-44, J-42]
- **Fluid.** Min/max container widths, relative units, flex for one dimension, grid for two, nested stacks over absolute positioning, responsive images. Design for the real fold (about 1920×1000 including browser chrome). [J-21, J-31, K-27, K-40]
- **Text on images.** Keep text off the focal point; choose images with room for text. Use a bottom-up gradient (around ¾ of the height) or progressive blur rather than a flat overlay. [K-05, K-37, K-41, K-50]
- **Chrome.** Large main workspace; collapsible or resizable sidebars; a focus or hide-UI mode for media and editors. Sticky headers keep only key tools. [J-05, J-06, J-09, J-17, J-24]

## 5. Components and states

- **Buttons.** Default, hover, pressed, focus, disabled, and loading. Horizontal padding about twice vertical. One primary per view or hero; secondary is outline or text-only. A multi-part button (pill + icon) must read as one button. Show loading or disabled immediately on submit. Act on release; menus open on press. [K-09, K-24, K-45, J-05, K-02]
- **Destructive.** Red fill for the destructive action in its own confirmation dialog, with Cancel as ghost. Elsewhere, destructive controls can turn red on hover. Prefer edit-in-place over delete-and-recreate. [K-41, J-32]
- **Forms.** Label above the input; never placeholder-as-label; placeholders show example values. Inputs: off-white fill with a border around 40% opacity. States: focus, error (red border + message), warning. Use a calendar picker that also accepts typing, not three dropdowns. Progress indicator on multi-step forms. [K-41, K-09, K-01, K-24]
- **Choice controls.** Radio for one-of, checkbox for many, toggle for on/off settings, segmented control or dropdown for a few discrete values, slider (with snap points) only for continuous values. Never a "No thanks" option where an unchecked box already means no. [J-04, J-32, J-11]
- **Chips and badges.** Vertical padding ½–¼ of horizontal; thinner than buttons; never the primary CTA color. Filter chips look different from buttons and tags. Badges show numbers, not mystery dots. A "Most popular" badge goes on one item. [K-41, J-23, J-15, J-04]
- **Cards in grids.** Whole card is the link (arrow fading in on hover is fine); drop per-card CTAs unless the action is specific. Cards must not grow on hover so their button slides out from under the cursor. No dead cards that look clickable. Card info: drop field labels, group like data, rank by importance. [K-41, J-32, K-10, K-26]
- **Tables.** Chips for enumerated fields, numbers right-aligned, long text truncated, inactive rows dimmed, search/filter/sort, row actions on the row. Add decision-relevant comparison columns. [K-06, K-17, J-11, J-32]
- **Overlays.** Popover for quick non-blocking edits; modal for focused tasks tied to the page (then a confirmation toast); new page for large or lasting content with back/breadcrumb. Modals for sub-sections can have their own deep links. Toasts for success, warnings and errors; toasts triggered by shortcuts name the key pressed. [K-17, K-10, J-25, J-01]
- **Tooltips.** On every icon-only or ambiguous control. About 1s delay on first hover, then instant on neighbours. Explanations go behind an info icon, not hover-delay only. [K-06, K-22, K-02, J-01]
- **Pricing.** At most 4 plans. Plan name small, price large, actual discount shown, one-line description, ✓ features including one ✗ it lacks, fine print ("billed annually"), and an action-specific CTA. Separate price from features with a tinted fill. [K-10, K-41]
- **Sidebar.** Icon + short label, grouped links, active indicator, account card at top, settings and help at bottom, collapsible. [K-17, K-10, K-25]
- **Footer.** Sized to the real link count; don't copy a five-column mega-footer for five links. [K-41]
- **Carousels.** Position indicator (dots or count), arrows beside it, swipe/drag support; avoid more than about 10 items. [K-41, K-50, J-25]
- **Search fields.** Clear (×) button, autocomplete where it helps, auto-focus on open. [J-11, J-06]
- **Status.** Show state as a state: a downloaded item gets a check, not a greyed download icon; progress shows inline; partial availability gets its own state, not just on/off. Stateful icons change visibly (filled when saved). [J-06, J-11, J-30, K-22]

## 6. Icons and imagery

- One icon library, one stroke weight, one fill style, one corner style, one size grid. One icon per concept everywhere, and never one icon for two concepts. Simpler glyphs at small sizes. [J-06, J-09, J-18, J-19, K-22]
- Label icons unless they are universal (home, search, bookmark, profile). Don't merge distinct actions into one icon to look minimal. [K-41, J-23]
- Interactive icons are monochrome; decorative illustration can be richer, in a visually separate zone. [J-01, K-45]
- Use Lucide, Phosphor or a similar library for universal concepts; never emoji as UI icons. [K-10, K-23] Draw custom icons to the library's exact spec for product-specific concepts and stateful icons that carry real data (spec, template and example in premium-craft.md §5).
- Use real product screenshots, cropped to the part that matters, optionally tilted slightly or popped out with a shadow; never generic stock that doesn't show the product. Imagery is large where the user needs to judge (food, products, portfolios). [K-07, K-10, K-15, J-04, K-52]
- Guarantee contrast for controls over images (a scrim or a backing circle). [K-21]
- Subtle grain: an SVG `feTurbulence` (`fractalNoise`, high `baseFrequency`) layer at low opacity on `body::before`, not a PNG. [J-44]

## 7. Interaction and motion

- **Purpose.** Motion adds clarity or feedback, or it goes. One motif repeated beats many effects. Dashboards get minimal motion. [K-20, K-04, K-17, K-21]
- **Easing.** Never linear. Springs or slight overshoot for small pop-ins (e.g. ~500ms, stiffness ~600, damping ~24). Motion follows the direction of the gesture; shared elements carry continuity between screens. [K-14, K-08, K-24]
- **Feedback.** Every action responds: save icon fills, destination tab gets a dot, add-to-cart animates, loading → success sequence. [K-22, K-24, J-04]
- **Undo over confirm.** Delete immediately with an undo toast or a recently-deleted area; confirm (or hold/swipe-to-confirm) only for irreversible actions like payments and bulk sends. Autosave and version history over Save/Cancel. Optimistic UI. [K-02, K-14, K-12, J-11]
- **Never lose the user's place.** Keep scroll position after actions; don't snap carousels back; don't reorder list items while their status changes; never let a stray gesture wipe typed input. [J-04, J-32, J-17]
- **Hover intent.** Submenus use a safe triangle; tooltips as above; hover-revealed controls stay while the pointer is near and don't vanish on a one-pixel exit. [K-02, J-06, J-01]
- **Drag.** Drop indicator plus edge auto-scroll that speeds up near the edge. [K-02]
- **Shortcuts.** Visible hints, a cheat sheet, visible feedback, and a visible control for anything that has a shortcut. [K-12, J-09]
- **Loading.** Real progress, never stalled at 99%. Skeletons and short loops. Preloaders short and skippable; long intros skippable. Pause control for continuous shimmer or loops. [J-42, K-18, K-33, J-27, K-24]
- **Scroll.** No scroll-jacking for navigation (fine for a short pinned storytelling beat). "Load more" over infinite scroll so the footer stays reachable. Reading-progress bar on long articles. [J-42, K-21, K-37]
- **Performance.** Prefer CSS (`transform`, `filter`, `transition`) over JS, WebGL and 3D; heavy pages lose about half of commerce visitors after about 3 seconds. [J-42, J-36]
- **Effects done right.** Blurred headers fade into content with a gradient mask (add `-webkit-backdrop-filter`). Glass is all-in or skipped, and checked for contrast once composed. Lowering a panel's opacity to make it feel lighter kills contrast; use blur or remove the panel instead. [J-26, J-08, J-10, J-03]

## 8. Information architecture and flows

- **Map the flow first.** List the product's core jobs; design the primary action first and add UI only as intents expand. List every element (every setting, every option) before reorganizing; group, deduplicate, and remove duplicate entry points. The things beginners forget: back and skip, search and "other" options, navigation, hidden states, hovers. [J-38, K-21, K-43, J-01, J-32, K-22]
- **Frequency.** Frequent tasks take one click and sit in reach; rare ones go under More. Order menus by frequency, keep the order the same in every context, and put the top actions as an icon row at the top of a context menu. One menu per object. [J-01, J-06, J-14, J-15, J-17]
- **Discoverability.** Sort, view mode and search live in the toolbar, not only in right-click menus. Important pages are tabs, not buried at the bottom. Every page that has a create action shows it. [J-01, J-06, J-09]
- **Lists that grow.** Search, sort, filter, grid/list view, visible count, bulk select with contextual bulk actions, and a "new" marker or newest sort. Hide filter options that would return nothing; show counts on filter chips. [J-11, J-14, J-15, K-17, J-32, J-04]
- **Search.** Input at the top, filters visible right below and combinable with the query, filters available on mobile too. Real results first, not recommendations. Group results by type, distinguish types visually, pin a top hit. For ambiguous queries, show both meanings. Search opens in place; its scope matches where it sits. [J-06, J-15, J-17, J-18, J-16]
- **Cross-linking.** Entity names (people, projects, owners, artists) are links, with hover previews showing the fields that matter from this context. [K-01, J-06]
- **Metadata placement.** Important facts (duration, date, price with fees, rating) go at the top, not the end. [J-06, J-04]
- **Settings.** A few clear tabbed categories (merge single-item ones), basic before advanced on the same page, one-line plain descriptions, longer help behind an info icon, child options hidden when the parent is off, human words instead of codes, consistent terms, presets for bundles. When users split on a preference, make it a setting. [J-01, J-08, J-09, J-11, J-17]
- **Progressive disclosure.** Frequent primary actions always visible; secondary on hover or swipe; advanced collapsed by default. A fast path and a detailed path for creation flows. After creating something, suggest the logical next step with a skip. [K-06, K-10, J-11, K-19]
- **Onboarding.** No slideshow modal. Ask what the user is here to do, tailor the workspace, help them make their first real thing, reveal one tip at a time. Don't demand high-effort choices without information. Allow trying without sign-in where possible. [K-01, K-06, J-18, J-05]
- **Personalization.** Visible and controllable: show inferred interests and let users mute or confirm them; let users pin, hide and reorder home sections. [J-15, J-18, J-23]
- **Status in view.** Keep timers, progress and current state visible in the main view rather than a page away. [J-11, J-06]
- **Respect.** No dark patterns: hidden or reworded unsubscribe, confirmshaming, last-second offers, nags without "don't ask again", pre-checked hidden opt-ins, shrunk hit areas. Don't churn navigation without a reason; muscle memory has value. Ship 80% of features at 100% quality. [J-13, J-09, J-15, J-10, J-17]

## 9. Dashboards and data

- Lay widgets out by priority: most important top-left, least bottom-right. Merge related cards; cut decorative widgets. Don't repeat a row of four KPI cards on every page. [K-40, K-10]
- Charts: familiar line or bar forms with axes, horizontal gridlines, value labels, a summary, a legend, a time-range control, and a previous-period comparison where useful. No smoothed curves that misstate values, no fading the latest data, no rounded bar tops that hide the value, no invented chart types. On hover, show the value and dim other series. [K-17, K-22, K-40, K-41]
- Pick the chart for the data (diverging bars for income vs expenses, a timeline for time-ordered events instead of a time-sorted table). Show actual proportions, not vague labels like "Mostly positive". [K-06, K-40, J-32]
- Every widget action makes domain sense. [K-40]
- Data-heavy tools stay visually plain; save playful or skeuomorphic styling for low-density, unhurried contexts. [J-13]

## 10. Mobile

- One screen does one job. Each region scrolls in one direction. [K-08]
- Primary navigation and frequent actions (like, save, share, settings) in the bottom thumb zone; avoid top corners for frequent actions. Bottom bar with 3–5 items, no oversized center "+" bump, inactive icons still clearly visible, active shown by brand color or a filled icon. [K-08, K-41, J-13, J-14, J-23, J-30]
- Touch targets at least 44px and separated so neighbours don't steal taps. [K-08, J-30]
- Bottom sheets keep the user in context. Pressed states replace hover. Gestures behave the same in every context. Design mobile as its own layout, not a shrunken desktop. [K-08, K-16, J-30, J-17]

## 11. Landing pages and marketing sites

- The product is visible above the fold. One primary CTA in the hero, optionally one secondary (text or outline). Headline about 7 words, subtext about 14, saying how it helps. Don't repeat the company name. [K-07, K-10, K-05, K-13]
- Conventional SaaS sections (logo strip, tabbed features with every tab designed, bento, line-grid) convert because they are familiar; when the brief is a conventional SaaS page, use them but differentiate with subject-specific detail. Nav dropdowns with thumbnails help scanning. [K-28, K-31, K-37]
- Use the "one unexpected, well-built moment": break the pattern once. A 404 page can carry personality. [K-20, K-13]
- Decorative scattered elements: larger behind, smaller in front, a clear margin around text, fading toward the edges. A vignette pulls focus to the center; a light noise texture can help text sit on imagery. [K-04, K-13]
- Thin vertical frame lines can hold very wide screens together. [K-07]
- Don't import award-site showcase trends (scroll-jacking, heavy WebGL, custom cursors everywhere) into commerce or task-focused sites. Custom cursors, if used, are scoped to media and cards. [J-42]
- Portfolios: name and what you do immediately, a face, two or three pages at most, large visuals ahead of text, visual case studies, and some honest personality. [K-52]

## 12. Review checklist

Run through this list before calling a screen done:

1. Can I say why each element is here for this user?
2. Does the hierarchy read in five seconds?
3. Is every control's purpose obvious without pressing it?
4. Does every interactive element have all of its states?
5. Do loading, empty, error and success states exist?
6. Are the icons from one set, with one meaning each?
7. Does color appear only where it means something?
8. Does dark mode stand on its own as a palette?
9. Does everything pass AA, including glass surfaces and text over images?
10. Are any of the vibe-coded tells from SKILL.md calibration trait 6 present?
11. Is it aligned to the grid, with no nested containers?
12. Is the work checked at real size on desktop and phone?
13. Has the premium-craft.md §10 checklist been run (state matrix, one pattern per situation, break-it pass, custom icons, signature details, flow briefs)?

Items 1–12 come from J-09's review criteria (onboarding, intrusiveness, customization, navigation, clutter, consistency, features), K-20's five-second test, and K-45's advice on viewing at real size.
