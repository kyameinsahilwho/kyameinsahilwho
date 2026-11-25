# Premium craft reference

How a product gets past looking decent to feeling premium, and how to make the parts that are its own: custom icons, signature details, and flows. Distilled from two talks, with timestamps kept so a rule can be traced:

- **[TG]** Tim Gabe, "The Psychology of Premium Apps" (Oct 2026)
- **[KD]** Katie Dill (Stripe), "How to scale intent, quality, and artistry with AI", Lenny's Podcast (Sep 2026)

The studies and figures are as the speakers reported them. Use them to explain the reasoning, not as precise citations. SKILL.md's rules still apply. This file covers the work that sits on top of them.

## Contents
1. The commodity ceiling
2. State matrix: every state, not just the happy screen
3. Coherence: one product, not 80 screens
4. Recovery: the worst moment, designed best
5. Custom icons
6. Signature details
7. Flow design
8. Point of view, encoded into the system
9. The editor pass
10. Checklist

## 1. The commodity ceiling

- **Decent is the floor now.** Anyone with an AI tool and a pattern library can ship something decent in a day, so most new products look familiar. Pretty and premium are different things: the look gets a product picked, but evidence that it's good gets it called premium. People keep a quiet score of that evidence. [TG 00:00, 00:59]
- **Better tools only raise the floor.** Whatever a tool learns, every competitor gets the same day. What stays yours is having thought through every state of the product for your users. [TG 03:22]
- **Three watch points produce "zombie UI":** UI that is monotonous, vacant, or uncared for. [KD 02:17–03:54]
  1. *Most-probable answers.* LLMs give what has been popular, not what is specific to this brand or these users. In the talk's example, a Korean barbecue site looked like a software company.
  2. *The temptation of done.* A generated interface looks finished in seconds, with rounded corners and drop shadows. A polished look hides whether it solves the problem or differs from anything else (the microwave-burrito trap).
  3. *Disposable work.* Something quick to make gets treated as throwaway, and nobody asks who will maintain it or how it fits the whole.
- **What people pay for** is a product that has thought through every state, where the connections between screens hold together and the whole thing feels like one product someone cared about. [TG 05:25]

## 2. State matrix: every state, not just the happy screen

AI tools explain their design reasoning confidently, but about a quarter of it never reaches the interface. What gets dropped is the unglamorous part: showing what the system is doing, undo, and recovering from errors. Researchers call this gap "design theater", and the user pays for it in effort ("did that tap work? can I go back?"). [TG 01:41]

**After every action, the user can answer three questions:** what just happened, can I take it back, and what do I do next? [TG 03:22]

**Anything instead of nothing.** Never answer an action with a blank or a bare refusal. A mic test too short to count as a session should still show the level it heard and say how long to record next time. In the redesign that fixed this, the founder said of the old version, "I was expecting anything instead of nothing — that right there is where we lose them." [TG 02:38]

Fill in this matrix for every screen in a core flow during planning. A blank cell is a design task, not "n/a", until you've decided it can't happen:

| State | What the user sees | Primary action |
|---|---|---|
| First use (empty) | What this place is for, plus the first real thing to make | Create / import |
| Loading | Skeleton or real progress, with the layout already in place | — (cancel if long) |
| Partial / in progress | What's done so far and what's still running | Continue / wait |
| Success | What changed, in the words of the action ("Published") | Logical next step + undo |
| No results | The query, a suggested fix, a way out | Clear filters / broaden |
| Recoverable error | What happened, specifically, and that their input is safe | The fix, inline |
| Blocking error | What happened, what it affects, who can help | Contact / retry later |
| Offline / timed out | What's saved and what's queued | Retry (automatic when back) |
| Limit reached | Count used, count total, exact reset date or upgrade path | Upgrade / wait / manage |
| No permission | Who can grant it | Request access |
| Expired / stale | That it changed and when | Refresh, keeping their place |

## 3. Coherence: one product, not 80 screens

- **People live in the whole product.** Teams review one screen at a time, each one fine as a happy-path prototype. Users see screen 80 next to screen 1, for months. [TG 04:10]
- **Users underreport inconsistency.** In a 2009 University of York study, moving a site's navigation bar from left to right partway through a task more than doubled time on the page, and people stayed slower on later pages too. Most noticed the change but believed it hadn't slowed them down. So inconsistency costs more than users will say or analytics will show. Keep things where they are between screens. [TG 04:47]
- **AI makes the problem worse.** When a new screen takes a minute to generate, it's easy to end up with 80 screens that don't quite agree. [TG 05:25]
- **Coherence audit:**
  1. List the situations that recur: limits, empty states, errors, confirmations, success feedback, paywalls, loading, permissions, destructive actions.
  2. For each one, find every place it appears. Compare the words, the component, the numbers shown, and the next step offered.
  3. Merge them into one pattern and use it everywhere. Undertone's two different "you've used all your sessions" screens became one pattern: a "2 of 2 sessions used" badge, one line saying both sessions this month are used, and the exact date they refresh. It's a small copy and layout change that matters at scale. [TG 05:25]
  4. Prefer specific facts to generic messages: counts, dates, names, amounts.
- **The one-hour test.** Use the product for an hour as a real user would, on real data. Write down every spot where it stops feeling like the same product. Then fix the pattern, not just the spot. [TG 05:25]

## 4. Recovery: the worst moment, designed best

- **The service recovery paradox.** When a failure is handled well, people can end up as happy as if nothing had gone wrong, or happier. ("This went south, but they caught me.") This is where a product stops being a matter of opinion and becomes clearly premium. AI tools are weakest here, because getting recovery right takes real use and deliberately breaking things. [TG 06:44, 07:24]
- **One bad experience is enough.** About a third of people walk away after a single bad experience. Most people don't leave because of a home screen. [TG 09:05]
- **Recipe for a failure state:**
  1. Say what happened, specifically ("Your card was declined by your bank", not "Something went wrong").
  2. When money or data is involved, say what's safe ("You weren't charged. Your draft is saved.").
  3. Give one primary next step, and put the fix right there: retry, edit, choose another method, check the balance.
  4. Offer a route to a person where the stakes are high (a contact-support button right in the alert).
  5. Keep everything the user typed, and keep their place.
  
  The crypto-card client's support lead described their old declined payment as "zero information on what you should do, you're just left alone." The fix was an alert that tells you to check your balance, with a contact-support button right there. Together with a few other changes, new accounts grew 60% and card top-ups 79%. [TG 08:12]
- **Common recoveries:**
  - *Offline mid-flow:* keep the form, queue the action, show "Saved on this device, will send when you're back online", and retry automatically.
  - *Upload failed:* retry only that file and keep the others.
  - *Session expired:* re-authenticate in place, then return to the same screen with input intact.
  - *Payment failed:* show the reason, confirm whether they were charged, and offer to retry or switch method.
  - *Hit a limit:* use the limit pattern from §3.
- **Delight where the stakes are low.** A failure can become something people enjoy: Chrome's offline T-Rex was played around 270 million times a month four years after launch. Keep playfulness to low-stakes moments (offline, 404, waiting). Never make jokes when someone's money, health, or data is at risk. There, calm clarity is the premium experience. [TG 06:44]
- **Break-it pass:** turn off the network mid-flow, fail a payment, empty every list, deny every permission, use the longest real content, throttle to slow 3G, double-submit, press back mid-flow, let the session expire, and open on a phone. Design each resulting state as carefully as the success screen. Many teams skip this, which makes it one of the cheapest places to buy a feeling of premium quality. [TG 09:05]

## 5. Custom icons

Library icons are shared by everyone. Custom icons are where a product shows it understood its own world. Small details like a calendar icon showing today's date show the builder cared. [KD 04:40]

**When to draw one:**
- *Universal concepts* (search, close, menu, settings, home, user, share, trash, edit, add): use the library icon. Recognition beats originality here.
- *The product's own nouns and verbs:* draw a custom icon when the library glyph is generic or misleading for the concept. Examples: a session credit, a mic test, a top-up, a recipe step, a held shipment, a shift swap, a lab result.
- *Stateful icons that carry real data:* the date in a calendar icon, remaining credits, battery or progress fill, a "synced X ago" mark, a step count.
- *The brand mark and its small animated moments*, plus empty-state and error-state illustrations.
- *Never* draw icons for decoration, colored icon tiles, or emoji stand-ins. A custom icon earns its place by making a concept faster to recognize.

**Spec: match the library so custom and stock icons sit side by side unnoticed.** For Lucide-style sets:
- 24×24 viewBox; `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, round caps and joins.
- At least 1px padding (a 22px live area). Keep 2px between separate shapes. Rectangles use `rx="2"`.
- Snap to whole and half pixels so 2px strokes stay crisp. Keep optical weight equal: circles and diagonals can extend slightly past the box that squares fill.

For Phosphor or another set, read its grid and copy that set's stroke, corner, and padding values instead.

**Construction:**
1. Name the concept in one word. Pick one metaphor from the subject's world that a user would recognize, not an abstract shape.
2. Sketch three candidates and choose the one that reads at 16px.
3. Build it from the fewest shapes possible, preferably by modifying a related library glyph (ticket + count, mic + level bars) so it belongs to the family.
4. Test it at 16, 20 and 24px, in light and dark, next to its neighbors in the real toolbar or list. Simplify anything that turns to mush at 16px.
5. Use one icon per concept everywhere, and never the same icon for two concepts. Add the new icon to the shared icon set so later screens reuse it.

**Template:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
     fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <!-- concept: one metaphor, fewest paths, inside x/y 1–23 -->
</svg>
```

**Stateful example (calendar showing today's date):**
```jsx
function CalendarToday({ date = new Date(), size = 24, label }) {
  const showDate = size >= 20; // digits are illegible below ~20px; fall back to the plain glyph
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
      {showDate && (
        <text x="12" y="19" textAnchor="middle" fontSize="8" fontWeight="700"
              fill="currentColor" stroke="none">{date.getDate()}</text>
      )}
    </svg>
  );
}
```

**Delivery:** each icon is a component or a sprite symbol using `currentColor`, so it follows the text color and theme. Decorative icons get `aria-hidden`. A standalone icon button gets an accessible name and a tooltip. Keep icons uncolored unless the color shows status.

**Illustrations** (empty, error, onboarding) use the same line language: matching stroke weight and corners, at most two palette colors plus neutrals, subject-specific content, and a dark-mode version. They support the message and the action. They never replace either one.

## 6. Signature details

- **Budget one or two per product**, placed where the product's point of view becomes tangible. These are the "unexpected details" that make people think "I can't believe they thought of that", tied together by one recurring theme so they read as one maker's hand. [KD 04:40, 14:15]
- **Where to look:**
  - The most frequent moment (the action people take every day).
  - The worst moment (§4).
  - Moments where real data can show up in the chrome: a date in the tab, a count in the icon, the user's own content tinting the theme.
  - Moments of anticipation, like Stripe's Link agent wallet, which builds in troubleshooting for problems an agent might hit while buying. [KD 04:40]
- **Examples of the right size:** a small life-giving animation on the product's own mascot or mark; the exact refresh date on a limit; an offline state you can play with; a support button inside the decline alert.
- **Test:** remove the detail. If nobody would miss it, it was decoration. If it could appear unchanged in any other product, it isn't a signature.
- **Craft depth:** go one level deeper than the customer can consciously see. At Stripe, "Pepsi bubbling" means 17 small fixes to an ad: frost here, softer edges, slightly smaller bubbles. Stefan's opening animation took 56 iterations to stop feeling stilted. The aim isn't perfection, it's care users can sense. [KD 07:22, 15:05]

## 7. Flow design

Design flows from the user's job, not from a screen inventory or a template.

**Flow brief, one per core flow:**
```
Job:        what the user is trying to get done, in their words
Trigger:    what brings them here, and from where
Arrival:    what they already know / have; what we can prefill from context
Goal:       the moment they'd say "done"
Steps:      one line per step: screen → primary action → what changes
Branches:   decisions, and every failure from the state matrix
Next need:  what they'll want right after the goal
Return:     how a returning user does it in the fewest steps
```

**Notation for planning** (use this alongside the ASCII wireframes):
```
[Cart] --Pay--> (processing) --ok--> [Receipt: "Paid €42"] --> suggest: Track order
                     |--declined--> [Decline alert: reason · Check balance · Contact support] --retry--> (processing)
                     |--offline---> [Saved, will retry] --auto--> (processing)
```

**Rules:**
- **Ask only for what you need, when you need it.** Default and prefill from context. Defer optional fields until after the goal.
- **Offer a fast path and a detailed path** for creation. Returning users get the short route: recent items, duplicate, keyboard shortcut.
- **No dead ends.** Every screen has a way back, a skip where skipping is safe, and a plain way out.
- **Show position and progress** in multi-step flows. Let people leave and resume where they left off, with input intact.
- **Anticipate the next need.** After creating something, suggest the logical next step (with a skip). Before a limit, warn with the count. At a failure, carry the fix inline.
- **One pattern per situation** across all flows (§3).
- **Judge by use.** A flow is practical when a first-time user finishes it without help and a daily user finishes it without friction. Walk it as both before calling it done.
- **Invent where the subject is underserved.** Chats, charts, and CLIs aren't the best interfaces we'll ever have. Where the standard pattern serves the job badly, prototype the interaction this subject actually wants: direct manipulation, a live preview, voice, generative or responsive views. Keep basic controls conventional (SKILL.md: distinctive identity, conventional mechanics). AI lowers the cost of building, so spend some of the savings on something special, and don't just make the usual thing faster. Protect the strange idea long enough to test it. [KD 16:26, 19:24]

## 8. Point of view, encoded into the system

- **Have a point of view or the model will supply one**, and the model's will be generic and backward-looking. Before designing, write a short brief: who the product wants to be to its users, what they care about, one or two qualities that decide details (Stripe's is optimism, which shapes colors, copy, topics, and what ships), and what you refuse to do. [KD 05:45, 06:23]
- **The quality bar doesn't depend on how something was made.** Users don't care whether it was made with AI, only whether it's good. Hold generated output to the same standard as anything else. [KD 07:22]
- **Build taste by noticing.** Notice what users need, not just what they say. Notice what signals good, great, and meh in products you use and in neighboring fields like art, architecture, and print. [KD 08:21]
- **Make the system the object of design.** There won't always be a designer in the room to fill gaps, because agents and other builders ship screens too. Write the decisions down. Encode them as tokens, plus **full templates and flow patterns** (the limit pattern, the failure pattern, the empty pattern, the custom icon set), not just atomic components. Make the system opinionated enough that the same prompt gives the same result. The old system scaled consistency; the new one has to scale intent. [KD 09:00, 10:50]
- **Gutenberg's lesson.** He cut 290 characters (alternate widths, abbreviations, ligatures), not 52, so machine-justified text wouldn't show rivers of white space. A system should be extensible and opinionated enough that machine-made output feels handmade. [KD 10:03]
- **When you produce files in a real codebase**, put the custom icons, recurring state patterns, and the point-of-view brief somewhere reusable (an icons module, a patterns file, a short DESIGN.md) so the next screen inherits them instead of reinventing them.

## 9. The editor pass

- **A system can satisfy every rule and still be dead** (Christopher Alexander). Rules are the baseline, not the goal. [KD 12:10]
- **Built isn't done, and done isn't good.** Quality filtering used to happen before and during a build. Now it has to happen after, when saying no is harder. Someone has to own the end-to-end view. On a design task, that's you. [KD 12:10, 13:15]
- **Experience it as a user would** and ask:
  - Does it actually solve the problem?
  - Does it match how the user thinks about things?
  - Is it coherent across the whole journey?
  - Is it fully formed, and if not, what would push it to completion?
  [KD 13:15]
- **What makes it great** (after Nabeel Qureshi): unexpected details, a deeper meaning behind the surface, and continuous themes that tie it into a whole. AI slop offends because the details don't matter in it: "the cup is green, but may as well have been blue." Be able to give a reason for every choice. [KD 14:15]
- **Improve inputs, stress outputs.** Feed in the point-of-view brief and source material, not a one-line ask. Push past the first acceptable result. Where available, use an adversarial reviewer (a subagent or a fresh pass) to critique the work, but the push for better is yours. [KD 18:35]

## 10. Checklist

1. Does the state matrix have a designed answer in every cell for each core flow?
2. After every action, does the user know what happened, how to undo it, and what to do next?
3. Does every recurring situation (limit, empty, error, confirm, success) use one pattern with specific counts and dates?
4. Has the break-it pass been run, and do failure states carry the fix inline and keep the user's input?
5. Do product-specific concepts have custom icons drawn to the library's spec, legible at 16px, one meaning each?
6. Are there one or two signature details that would be missed if removed and couldn't belong to another product?
7. Does each core flow have a brief, a fast path for returning users, and no dead ends?
8. Is there a written point of view, and can every major choice be traced back to it?
9. Are the custom icons, state patterns, and point of view saved somewhere the next screen will reuse them?
10. Has an editor pass been done end to end, as a real user, for at least one full journey?
