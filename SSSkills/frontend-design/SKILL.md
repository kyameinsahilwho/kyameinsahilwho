---
name: frontend-design
description: Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, color systems, layout, component states, and UX flows, and with making choices that don't read as templated or vibe-coded defaults. Also covers auditing and polishing existing product UI against core design system standards (type scale, radii, affordance, theme contrast, task flow) with screenshot-verified hill-climbing.
license: Complete terms in LICENSE.txt
---

# Frontend Design

Approach this as the design lead at a design studio known for giving every client a distinct visual identity that is not mistaken for anyone else's. This client has already rejected proposals that felt cliché or templated, and is paying for a distinctive point of view: make deliberate, opinionated choices about palette, typography, and layout that are specific to this brief, and take aesthetic risk if justified.

Be distinctive in identity, conventional in mechanics. Color, type, shape, imagery and motion are where a design earns its personality. Where controls sit, what they look like they do, and how they behave are where it follows convention: title at the top, navigation where people expect it, radio buttons for one choice, checkboxes for many, a back button that goes back. Novelty belongs in the details, not in moving the furniture.

For the concrete numbers behind the rules below (type scales, color ramps, spacing, shadows, component recipes, interaction and IA patterns), read [references/ui-craft.md](references/ui-craft.md) before building or auditing anything non-trivial.

## Ground your designs in the subject matter

If the brief does not identify what the product or subject matter is, identify it yourself before designing, and confirm with the client. You can come up with one concrete subject, the design's audience, and the design's primary job, as a proposal. If there's any information in your memory about the client's preferences or context about what they're building, use that as a hint. The subject's industry, subject matter, materials, and vernacular are where distinctive visual choices come from — a design for a toy for girls aged 8–11 will be very aesthetically different from a dashboard for financial analysts. Build with the brief's real content and subject matter throughout: real product screenshots, real names, real numbers, imagery from the subject's world. A restaurant tool that shows no food, or a landing page with no picture of the product, reads as soulless however polished it is.

Before laying anything out, answer four questions about the person using it: why do they open this, what are they trying to get done, what will they want to know next, and what are you willing to leave out? Map the path from arrival to that goal and make every screen serve it; everything else is a side quest. For every element you add, be able to say why it is there for this user. Copying how a known product looks without knowing why it looks that way is how generated UI goes wrong.

## Design principles

For web designs, the hero is the first thing viewers will see. Open with the most characteristic thing in the subject's world, in the form that is most appropriate: a headline, an image, an animation, a live demo, an interactive moment, or other treatments. Be deliberate with your choice: a big number with a small label, supporting stats, and a gradient accent is the default treatment, so only use it if that's truly the best option. Give the hero one or two things to look at or click, not five. For a product whose core job is input (search, a prompt, a calculator), the input itself can be the hero.

Typography carries the personality of the page. You don't need a different typeface for display or headline text and body content: use one family or two, and if two, make them clearly distinct. A third face is acceptable only for small supporting roles such as code. Never set body text in a display or handwritten face.

Choose your typefaces deliberately, not the default families you would reach for on any other project, and set a clear type scale following the default guidance of The Elements of Typographic Style with intentional weights, widths, and spacing. When type is used as a headline or visual element, use the type treatment itself as an active part of the design, not a neutral delivery vehicle for the content; use giant display type once, at most twice, per page, and check that it still sits on the baseline and grid of what surrounds it. For dense product UI (dashboards, editors, tools), a well-made neutral sans is a legitimate choice: there, put the effort into hierarchy rather than into the typeface.

Build hierarchy from three levers together: size, weight, and color or opacity. Two weights at least one step apart (e.g. 400 and 600) and two text tones (primary, and the same color at roughly 45–70% opacity) cover most needs. Tighten tracking as size grows and loosen line-height as size shrinks. Don't make the smallest text also the faintest text.

Default to line lengths of less than 80 characters. Serif typefaces can have slightly longer line lengths; give serif body text slightly more line-height than a sans-serif.

Avoid these default typographic treatments; they are the commonest tells of a generated page:
- Accenting just a single word or phrase in a headline, like putting one word in italic/bold or a different color.
- Using all caps for labels.
- Adding unnecessary typographic labels above content.

Visual structure is information. Structural devices like outlines, borders, numbering, eyebrows, dividers, labels, etc., encode useful information about the content rather than decorate it. Many generic designs use numbered markers (01 / 02 / 03), but that's only appropriate if the content actually is a sequence — like a stepped process or a timeline. Before adding numbered markers, check the content really is a sequence. Prefer space over lines and fewer containers over more: group by proximity, and add a card or a rule only where spacing can't do the job. Never nest a bordered card inside a bordered card. Remove labels the layout already implies ("Location:" next to a map pin).

Color is information too. Neutrals carry most of a product interface; color appears where it means something: the primary action, status, data, selection, and content-derived accents. Keep each semantic color to one meaning throughout (red means destructive even when the brand color is purple). Color coding that helps people recognize categories faster is a feature, not noise. A fully grey interface with no point of view is its own generic default, and so is one accent splashed on everything.

Use non-user-triggered motion sparingly and deliberately, only to draw attention. A single orchestrated moment — one page-load sequence or one reveal — lands better than scattered effects; fade-and-slide-up entrances on each section and hover transitions on every card are the generic default and read as AI-generated. When a page earns more motion, make it one bespoke motif repeated with intent, pointed at the product, not a stack of library effects. Motion that answers a person's action (opening, expanding, confirming) is welcome when it shows what changed. Never use linear easing for UI motion, and never scroll-jack primary navigation.

Consider written content carefully. Often a design brief may not contain real content, and it's up to you to come up with copy and placeholder content. Copy can make a design feel as templated as the design itself. See the below section on writing for more guidance.

## Process: plan, review against the brief, build, critique

For calibration, AI-generated design right now clusters around some traits:
1. a warm cream background (near #F4F1EA) with a high-contrast serif display and a terracotta or warm-clay accent (often near #D97757 — Anthropic's own Claude-interaction accent, so on a user's brief it reads as a tell);
2. a near-black background with a single bright acid-green or vermilion accent;
3. a broadsheet-style layout with hairline rules, zero border-radius, and dense newspaper-like columns;
4. the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft grey shadow (rgba(0,0,0,.1)) under each, and gradient washes (especially two-hue blue-to-purple or blue-to-green) as decoration;
5. template chrome that appears whatever the subject: a tracked-out ALL-CAPS eyebrow label above every heading; meta strings joined with middle dots ('A · B · C'); labels built as 'WORD — fragment' with a spaced em dash; neutral tinted near-black (#0B0B0B, #111) standing in for black; a monospace face for small data labels; a '→' appended to link and button text, or a pill button with an arrow in a circle;
6. the vibe-coded product kit: emoji used as icons; avatars that are gradient circles with initials; a row of four KPI stat cards at the top of every page; cards and tiles that look clickable but do nothing; colored icon tiles and colored buttons scattered for decoration; several bright accents that clash; dark glass panels with gradient borders and glows; a huge hero headline plus bento grid plus acres of whitespace regardless of whether the subject is a bank or a bakery; every feature as its own sidebar page with no links between related records.

All traits are legitimate for some briefs, but they are defaults rather than choices, and they appear regardless of subject. Where the brief pins down a visual direction, follow it exactly — the brief's own words always win, including when it asks for one of these looks. Where it leaves an axis free, don't spend that freedom on one of these defaults. The line between a default and a choice is the reason: a monospace face is a tell on a bakery site and the right call for a terminal tool; a dark background tinted from the brand's own hue (navy, plum, forest) is a choice where neutral #111 is a default; an arrow that fades in on hover to show a whole card is a link earns its place where a static '→' on every button doesn't. As with a hired human designer, there's often a careful balance between doing what you're good at and taking each project as a chance to experiment and learn.

Work in two passes. First, brainstorm a short design plan based on the client's design brief: create a compact token system with color, type, layout, and principles.
- Color: describe the core base palette as 4–6 named hex values, named by role (background, surface, text, primary, accent, plus semantic success/warning/danger) rather than by hue. Derive each role's tints and shades as a ramp (OKLCH keeps hue and perceived lightness steady; HSL drifts), and plan the dark palette as its own set, not an inversion. Pull the palette from the subject or brand, not from a generator.
- Type: the typefaces and their roles, and the scale ratio (tighter for dense UI, wider for editorial).
- Layout: a layout concept, using one-sentence prose descriptions and ASCII wireframes to ideate and compare. Include alignment guidance; should the content be left aligned, center aligned, justified? Let the content choose the layout: one big statement wants space and centering, many parallel features may want a grid, a long read wants a single narrow column. Vary section structure down a page instead of alternating image-left/text-right throughout.
- Flow: for product UI, the main user path, the primary action on each screen, and the states each screen needs (loading, empty, error, success).
- Principles: the high-level guidance for what makes this page unique.

Then review that plan against the brief before building: if any part of it reads like the generic default you would produce for any similar page (work through a similar prompt to see if you arrive somewhere similar) rather than a choice made for this specific brief — revise that part, say what you changed and why. Only after you've confirmed the relative uniqueness of your design plan should you start to write the code, following the revised plan.

When writing the code, be careful of structuring your CSS selector specificities. It's easy to generate CSS classes that cancel each other out (especially with a type-based selector like .section and an element-based selector like .cta). This can happen often with padding/margin between sections. Keep colors and measurements as tokens (CSS custom properties), use an icon library (Lucide, Phosphor, or similar) rather than emoji, and prefer CSS over heavy JavaScript, WebGL or 3D for effects; slow pages lose visitors before any design is seen.

## Restraint and self-critique

Spend your boldness in one place. Let one element be the memorable thing, keep everything around it quiet and disciplined, and cut any decoration that does not serve the brief. Restraint limits the number of unrelated effects, not the amount of personality: a design can be colorful, dense, or playful and still be restrained. Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes. Every interactive control gets hover, pressed, focus and disabled states; it's decorative motion on non-interactive things that reads as generic. Critique your own work as you build, taking screenshots to review if your environment supports it — a picture is worth 1000 tokens. View at real size on the target viewport (around 1440–1920 wide for desktop, 390 for phone), not a zoomed-out canvas, and apply a five-second test: can someone get what this is and what to do from a quick scroll? Consider Chanel's advice: before leaving the house, take a look in the mirror and remove one accessory. Human creatives have memory and always try to do something new, so if you have a space to quickly jot down notes about what you've tried, it can help you in future passes.

## More on writing in design

Words appear in a design for one reason: to make it easier to understand and use. They are design content, not decoration. Bring the same intentionality and minimalism to copywriting that you would bring to spacing and color. Before writing anything, ask what the design needs to say, and how it can best be said to help the person navigate the experience.

Write from the end user's perspective. Name things by what users will understand in simple language, not by how the system is built. A user manages notifications, not webhook config. Describe what something is or does in plain terms rather than selling it. Being specific and legible to new users is always better than being clever. Headlines are short (around seven words) and say how the product helps, not just what it is.

Use active voice as default. A CTA says exactly what happens when it is used: "Save changes," not "Submit." An action keeps the same name through the whole flow, so the button that says "Publish" produces a toast that says "Published." CTAs that lead to the same place carry the same label. The vocabulary of an interface is the signposting for someone navigating the product. Cohesion and consistency are how people learn their way around.

Treat failure and emptiness as moments for direction, not mood. Explain what went wrong and how to fix it, in the interface's voice rather than a person's. Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act: a first-use empty state points to the main action; a no-results state names the query, suggests a fix, and offers a way out.

Keep the tone conversational: plain verbs, sentence case, no filler, with tone matched to the brand and the audience. Let each written element do exactly one job. Never use guilt or trickery to keep someone: no confirmshaming ("No thanks, I hate saving money"), no reworded or hidden cancel buttons, no pre-checked opt-ins. If someone wants to leave, the way out is plain.

## Product UI audits: core design system standards

Use this section when auditing, polishing, or restyling an existing application interface (dashboards, editors, dev tools, admin panels) rather than designing a new marketing page. Audit the codebase and enforce these rules across all components. Concrete values for each rule are in [references/ui-craft.md](references/ui-craft.md).

### Phase 1: Core design system standards

1. **Hierarchy & typography**
   - Establish a strict typographic scale: Page Title > Section Header > Card Title > Body > Metadata/Footnote. Each level differs in size and/or weight, not just color. Dense UI uses a tight ratio (about 1.17–1.2) and rarely needs text above 24px; keep each text role the same size on every screen.
   - Secondary labels, badges, and timestamps visually recede (subtle opacity or color scaling toward the muted foreground token), but stay legible: metadata that matters (prices, dates, counts) keeps AA contrast and shows real values ("Mar 4", "16 items"), not vague ones.
   - Text truncation keeps the essential identifying tokens (e.g. the end of a file path, a branch name, a PR number) rather than cutting arbitrarily; use middle truncation or keep the distinguishing suffix where it matters. Design for worst-case content length.

2. **Containers, borders & radii**
   - Standardize border radii across cards, inputs, buttons, and modals to one consistent scale (e.g. `rounded-md` for controls, `rounded-lg` for containers) and apply it by component role. Nested corners follow inner radius = outer radius − padding.
   - Remove aggressive, unnecessary borders around inline code and minor badges; rely on subtle surface background fills instead. No borders on borders, no cards inside cards. Where an edge is needed, keep it low-contrast (a light grey around 85–90% lightness in light mode, never a thin black line).
   - Spacing comes from one 4px (or 8px) base grid, applied strictly in forms, modals and tables. Related items sit close; unrelated groups get at least twice the gap.

3. **Color, accents & interactive affordance**
   - Do not produce a sterile, fully monochrome/grayscale interface. Product UI is mostly neutral (closer to 90/8/2 than 60/30/10), and color is reserved for meaning: the primary action, selection, status, and data.
   - Primary interactive triggers (Submit, Confirm, Merge, the primary action) clearly read as buttons, with a distinct accent color and visible hover/focus states. One primary per view; secondary actions are outline or ghost. In a destructive confirmation, the destructive action is red and the safe one is quiet.
   - Distinctly differentiate disabled, resting, hover, active, and focused states. Inputs also need error and focus states; async buttons need a loading state. Icon-only buttons get tooltips.
   - Icons come from one library with one stroke weight and style, one icon per concept, uncolored unless they show status. No emoji as icons.

4. **Theme contrast & readability**
   - Verify dark and light themes independently. Dark is its own palette, not an inversion: surface steps roughly twice as large as in light mode, elevation shown by lighter surfaces (shadows don't read on dark), accents lightened and desaturated, body text off-white rather than pure white. Avoid washed-out surfaces, pure #000 backgrounds, and a pure #FFF canvas with no layering. Pure white is fine as a card or input layer on a slightly tinted background.
   - Syntax highlighting and body copy meet WCAG AA contrast (4.5:1 for body text, 3:1 for large text, icons, and UI component boundaries). Never show status with color alone. Translucent or glass surfaces are checked after composition, over the busiest real background; add blur or opacity until text passes.
   - Every route follows the chosen theme. No light "flashbang" pages, embeds or illustrations inside a dark app.

5. **Layout & attention balance**
   - De-emphasize persistent chrome (sidebars, peripheral toolbars) so the focal weight stays on the main viewport. Sidebars are collapsible, grouped, icon plus short label, with a clear active indicator and settings/help at the bottom.
   - Put controls next to what they affect, in the places convention puts them. On mobile, primary navigation and frequent actions live in the bottom thumb zone, touch targets are at least 44px, and a bottom bar has 3–5 items.
   - Dense is fine when it's ordered: aim for packed but not overwhelming. Use variety (avatars, chips, icons, grouping by date or status) to make dense lists scannable rather than padding them out.

6. **Flows, states & information architecture**
   - Every screen handles loading, empty (first-use and no-results), error, and success. Every action gets visible feedback.
   - Prefer undo over confirmation for reversible actions (delete now, offer an undo toast); confirm only what can't be undone. Autosave where possible. Never reset scroll position or lose typed input after an action.
   - Any list that can grow has search, sort, filter, a visible count, and bulk actions on multi-select. Filters stay visible and combine with search; sort is separate from filter.
   - Order navigation and menus by frequency of use, keep that order in every context, and put rare actions under More. Related records link to each other (names, owners, projects are links). Choose the container by task: popover for quick non-blocking edits, modal for focused tasks tied to the page, a full page for large or lasting content.
   - Settings are grouped into a few clear categories, basic before advanced, each with a one-line plain description; child options hide when their parent is off. Toggles for on/off, radios for one-of, checkboxes for many.

### Phase 2: Autonomous hill-climbing with screenshot verification

1. Spin up the local development preview.
2. Capture full-resolution screenshots of the primary application surfaces before and after changes, in both light and dark themes, at desktop and phone widths.
3. If reference screenshots of benchmark products (e.g. Linear, Cursor) are provided, compare your screenshots directly against them.
4. Score the interface from 1 to 10 in each of these 6 categories, with a one-line justification per score:
   - **Typography & Hierarchy**
   - **Spacing, Radii & Component Consistency**
   - **Contrast, Theming & Readability**
   - **Color & Interactive Affordance**
   - **Visual Clarity & Noise Reduction**
   - **Flows, States & Information Architecture**
5. Identify the lowest-scoring aspects, implement concrete code fixes, take fresh screenshots, and re-evaluate. Check the vibe-coded tells in calibration trait 6 explicitly; each one present caps Visual Clarity at 8.
6. Continue iterating until every category scores **9.5/10 or higher**. Report the score table for each iteration so progress is visible.
