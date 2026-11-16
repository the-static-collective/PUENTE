# PUENTE — The Living Classroom

Chapter 001: The Broken Bridge / El Puente Roto

## NEW: PUENTE 005 · Operation Signal Heist (high-school challenge)

**Play the heist:** https://puente.abundent.org/?heist=1

The original 60-second, beginner-friendly **Broken Bridge** example remains playable at `/?try=1`. For teenagers or higher-level language learners, a new **Hard Mode / Signal Heist** mission is available from the homepage or inside Puzzle Workshop.

- **Three mandatory advanced grammar gates:** one past-perfect tense puzzle, one subjunctive puzzle and one logical connector puzzle. The map has a fourth optional lock, which can be used as an alternate route.
- **No multiple-choice shortcut at those advanced fill-in gates:** players type the missing word or phrase. Matching ignores written accents and casing; spelling/grammar otherwise matters. An optional *initial-letter hint* offers a scaffold without giving away the whole phrase.
- **Two signal fragments (X and Y):** the player must find both before the extraction tile opens. Walking directly to EXIT fails until both are recovered.
- **Meaningful route planning:** the maze contains a two-way portal, detours and an alternate lock. The engine now uses inventory-aware shortest-path search and rejects routes where language gates can all be avoided.
- **Replay:** completion shows personal best moves/errors and an optimal-step benchmark. Local records contain only aggregate puzzle metrics (no names, accounts or server writes), allowing players to try a cleaner route.
- **Creation:** student map designers can paint X/Y fragment tiles and select from an expanded 20-question bank in each direction (10 foundations + 10 advanced). Heist maps require both fragments and two or more language locks. Old `puente.map-puzzle/v1` links remain readable.

Advanced grammar content is an **authored prototype**, not teacher-vetted course material. It should be reviewed for age, proficiency and learning goals before an actual class pilot. None of the answer texts typed into cipher inputs are saved or transmitted.

**Engineering:** `tests/puzzle-workshop.test.cjs` now tests item collection, mandatory grammar locks, sealed extraction, signed-free packet compatibility and remix lineage; `tests/browser-showcase.cjs` plays through the actual three-typed-answer heist in Chromium before publishing.

## NEW · Quest Garden v1 (MOTIF-inspired)

**Play → Observe class-level results → Generate a candidate → Teacher review → Approve → Replay → Repeat.** Every completed teacher-led classroom session automatically drafts a new **six-challenge** adventure in the teacher's browser. It observes only counts per round and the challenge topic, not student names or individual answers. If too few responses exist, the candidate is explicitly marked exploratory.

Open **04 / Quest Garden** to:

- Generate additional themed quest packs in five worlds using the human-authored 18-question bank in each direction (Spanish/English). These are **bounded recombinations**, not an AI inventing facts or a claim of infinite original questions.
- Inspect all six questions, answers and explanations, edit draft JSON, reject poor drafts, and **approve** a quest before classroom use.
- Import a new six-question quest drafted with your own ChatGPT using **Copy ChatGPT prompt** and the JSON import field, or export a pack to use elsewhere.
- Replay approved local packs from Teacher's Desk, and copy a **self-contained homework link** that works across devices with no login or backend. Links contain the whole practice pack and answers, so they are **for practice, not secure testing or grading**.
- After a room finishes, review the teacher-side auto-generated draft. A source/evidence note identifies whether it used genuine aggregated round evidence or simply exploration.

**Storage boundary:** Quest packs and derived drafts are held in the **current teacher browser only**, unless exported or shared by the teacher. There is no cross-teacher catalog, autonomously publishing new games, or server-side generative AI. A cleared browser can lose its packs. Export drafts and approved packs you want to preserve. The MOTIF native solver is not executing; source-pinned research inspired our design choices. See [the growth reasoning receipt](docs/GROWTH-LOOP.md).

**For multiplayer use of approved custom packs:** after deploying [the base Supabase schema](supabase/schema.sql), the same dedicated project must also apply [the Quest Garden upgrade](supabase/garden-v2.sql). Before applying that migration, ordinary built-in rooms still work on live mode, but custom packs require the upgrade. Existing shared projects are not an acceptable shortcut.


A bilingual, cooperative classroom game for phones. Teachers host a room; learners join with a classroom code; a correct class answer earns each plank of the bridge. If nobody gets a round right, the class discusses and retries.

**Repository:** https://github.com/the-static-collective/PUENTE  
**Intended website:** https://puente.abundent.org/
**GitHub Pages fallback:** https://the-static-collective.github.io/PUENTE/

## NEW: PUENTE 004 · Puzzle Workshop — the level editor

**Direct entry:** https://puente.abundent.org/?workshop=1

A portal-puzzle-inspired visual level editor now lets any learner design a complete navigable 8 × 6 language maze without coding, ChatGPT accounts, or database access. This feature is separate from the realtime classroom game and works across phones through **self-contained links**.

### Student makes a puzzle

1. Open **05 / Puzzle Workshop**. A playable example has a start, finish, a mandatory language lock and a harmless paired portal.
2. Choose Spanish or English and a story setting. Paint clear paths, walls, a start, an exit, 1–4 language locks, and optional portals A/B by tapping cells. Desktop supports drag-painting walls.
3. Select a lock clue from **ten authored language tasks per language direction**. Multiple gates can use different questions. No arbitrary names, messages, chat or user-generated text are accepted in this first version.
4. Use **Test my puzzle** to play it on the same device. Move with arrows/WASD or the on-screen arrow pad; unlock word gates by answering language questions. Stepping on portal A teleports to B and vice versa.
5. Press **Send to teacher** to generate an **unapproved draft link**. Copy and share it yourself. Saving to the local draft shelf is optional.

The engine rejects impossible mazes, missing start/exit, unmatched portal pairs, and layouts where someone could reach the exit **without encountering a language lock**. It therefore verifies the puzzle actually requires practicing language to complete. Validating reachability is *not* a proof of pedagogical effectiveness.

### Teacher reviews and publishes

1. Open the student's draft link (which has \`?puzzleDraft=\`).
2. See a read-only map and every language challenge with its answer and explanation. Click **Playtest this map**, navigate to the exit, and return to the inspection desk.
3. Check the explicit content-appropriateness box and click **Approve and create player link**.
4. Copy the resulting \`?puzzle=\` link and distribute it to the class. The new level appears in the teacher browser's local approved shelf.

The teacher's approval is a **client-side workflow**, not authenticated proof that the person approving is a teacher. A technical user could construct or modify a \`?puzzle=\` link without authorization. For real classroom use the adult should distribute approved links through their existing trusted class channel. Do not claim this is a school-approved publishing service.

### The important recursion

When a player completes any puzzle, **Remix this level** copies it into the visual editor with a parent-content fingerprint and increments its generation. The player can design a new route, add portals or locks, test it, and submit it for another teacher review. The parent fingerprint is a convenience lineage hint, **not cryptographic proof of authorship or ownership**.

One puzzle can therefore spawn many independent forks, without modifying or deleting the original. Players are creating *new maps*, not merely rearranging quiz presentation.

### Safety, privacy, limits

- Puzzle packets include only version, language, selected world, a 48-tile alphabet, parent content fingerprint and remix count. All clue text comes from the application's authored language bank; **no identity or open-ended student text is transmitted**.
- Links are encoded, **not secret or encrypted**. Avoid using them for formal testing, confidential homework, or unsupervised classroom publishing.
- No database, student login, persistent user profile, AI inference service, or AI moderation is required. Approved puzzles are stored only on the adult's current device unless a link is shared, so there is not yet a verified school-wide gallery.
- The builder's validation and playtest ensure navigability and interaction integrity, not factual proof that the material suits every learner. An adult still reviews it.
- The visual level editor is **inspired by the general puzzle-workshop concept**; it is an original lightweight educational editor, not Portal 2 itself.
- The word-lock bank is finite (10 clues per language), although map layouts and routes can be recombined freely.

Unit and integration checks live in [tests/puzzle-workshop.test.cjs](tests/puzzle-workshop.test.cjs); they run in GitHub Actions before deployment.

## NEW: PUENTE 003 · The Village Assembly

The third chapter allows students to influence what PUENTE creates **while they play**, without collecting free-text student submissions.

When the class restores **three** bridge pieces, members unlock an optional **Village Assembly**. Each member may choose one of three next-world destinations (Marketplace, Radio Station, Missing Words Mystery) and one of three game formats:

- **Signal Tuner:** rotate among three broadcast channels, decode a phrase, and transmit a response.
- **Map Navigator:** choose between three destinations on a visual map.
- **Word Weave:** rotate three word tiles to assemble a grammatically correct phrase before locking it in.

These are three distinct phone interaction surfaces that all submit an answer index validated by the existing classroom server. The Word Weave puzzle additionally requires actual word-order recognition; radio and map emphasize different presentation and navigation interactions, not different grading algorithms. No individual classroom votes or student identities are copied into new quest drafts.

Students can revise their preferences before the class ends. When the teacher finishes the final challenge, PUENTE takes **aggregate votes** (if any) together with aggregate challenge performance to generate **one reviewable Quest Garden draft**. If nobody votes, the garden still creates an exploratory draft. Only an adult teacher may approve and share the candidate; the student vote is not approval or evidence of learning.

### Technical boundaries

* **Same-device demo:** all three minigames and the Village Assembly work with no backend; data is confined to the browser profile.
* **Multi-phone rooms:** a dedicated Supabase project must have [schema.sql](supabase/schema.sql), [garden-v2.sql](supabase/garden-v2.sql), and **[village-assembly-v3.sql](supabase/village-assembly-v3.sql)** applied **in that order**, anonymous sign-ins enabled, and only its project URL plus publishable key in config.js. This has not been applied on your behalf. Until the upgrade is installed, older live rooms continue working but Village Assembly doesn't display.
* **Student privacy:** the backend stores at most one revisable pair of numeric votes per authenticated room member, attached to a temporary anonymous session. Direct table access is revoked; only class-wide counts are shown to the teacher. It expires with the room but physical row deletion still needs the documented administrative cleanup task.
* **Not endless new language knowledge:** the automatically generated games reuse finite authored language material, with different settings and mechanics; the teacher can import new ChatGPT-authored lessons for a larger supply.

**Tested:** Jest-free Node test suite runs as a GitHub Actions gate before deployment. To test locally: `node tests/quest-garden.test.cjs`. Native MOTIF runtime is not installed in PUENTE; the opt-in and question-growth process is a source-reviewed adaptation of its Two Doors research, not a live MOTIF reasoning service.

## Playable features

- Teacher's desk: create a room, show a code, start the adventure, reveal and explain answers, advance six challenges, see explorer counts/scores.
- Student portal: join with a fictional alias, answer once per round, see teacher's reveal.
- A classroom bridge illustration that gradually rebuilds.
- Homework: five self-paced puzzles with immediate feedback, including teacher-approved quest packs via shared links. Homework scores are not stored centrally.
- Switch between Spanish-learning and English-learning.
- Quest Garden: automatic post-class candidates, five worlds, topic-focused recombination, teacher review and approval, JSON export/import and ChatGPT authoring prompt.
- Same-device demo: works with no backend, including two tabs on one browser.

**Important:** This site launches in LOCAL DEMO mode. Demo rooms use local browser storage and therefore do **not** connect different phones. For a real multi-device classroom, configure Supabase as described below.

## Publish the website at puente.abundent.org

The live Cloudflare DNS record for abundent.org is already in place: **CNAME puente → the-static-collective.github.io (DNS only, not proxied)**. Porkbun delegates abundent.org to Cloudflare, so DNS changes must be made in the Cloudflare zone, not the dormant Porkbun zone. No nameserver changes are necessary.

1. Open repository Settings → Pages and choose **GitHub Actions** as the build/deploy source.
2. Under **Custom domain**, enter **puente.abundent.org** and click **Save**. This is required even though DNS points to GitHub. **Do not skip this: adding a CNAME file to the repository does not configure a custom domain for Pages Actions deployments.**
3. Open repository Actions and inspect the workflow named Publish PUENTE to GitHub Pages. It triggers on pushes to main; use Run workflow if needed.
4. Open https://puente.abundent.org/ and look for LOCAL DEMO. Enable **Enforce HTTPS** in Pages when GitHub has provisioned the certificate.
5. On the teacher screen, create a room, start the adventure, press Send demo answer on each round, and reveal answers. Open the Student portal in another tab in the **same browser** to join it.

No build tools or subscription are required to serve the site from GitHub Pages.

## Activate cross-phone live play

Create a **dedicated Supabase project for PUENTE**. Do not mix children's classroom data into existing unrelated projects.

1. Enable Anonymous Sign-Ins in that project's Authentication provider settings. Review CAPTCHA and rate limits before classroom use.
2. Review and execute the SQL in [supabase/schema.sql](supabase/schema.sql) in that dedicated project's SQL editor, **then** [supabase/garden-v2.sql](supabase/garden-v2.sql) to enable teacher-approved custom packs. These lock down the public tables, preserve a private answer bank, and authorize narrow RPC functions.
3. Copy the Supabase **project URL** and the **publishable key** (starts with sb_publishable_). Edit [config.js](config.js) to contain:

~~~js
window.PUENTE_CONFIG = {
  url: "https://YOUR-PROJECT.supabase.co",
  publishableKey: "sb_publishable_YOUR_PUBLIC_KEY"
};
~~~

4. Commit the config change. The site automatically redeploys.
5. Open the published link from two different devices or browser profiles. Confirm LIVE CLASSROOM, create a room as teacher, and join using the code on a second device.
6. Run Supabase security advisors, validate public table queries are denied, and perform a test session before school use.

**Never put a service-role or sb_secret_... API key in browser code or a public repository.**

Live sync uses secure RPC polling every two seconds. It is near-live, **not** WebSocket Realtime yet. Only the authenticated teacher may advance rounds, and the answer keys are kept in a private database schema. Room membership is checked on every data request.

Rooms expire after 12 hours. **Expiration blocks access but does not automatically delete database rows.** Schedule this cleanup using an administrator connection:

~~~sql
delete from public.puente_rooms where expires_at < now();
~~~

## Teacher's first lesson

Project the teacher screen. Select the learning language, create a room, and share the code. Each student chooses a **fictional alias, not their actual name**. Begin, discuss answers, reveal, and advance. There are six challenges per language. The teacher can explain the vocabulary while students collaborate orally.

For independent practice, use the Homework Quest tab or link to the website with ?homework=1 at the end. This is **self-study**, not classroom grading. The class game deliberately uses no names, emails, student IDs, or formal grades.

### A prompt for the teacher's ChatGPT

> Help me write six cooperative classroom challenges for students aged [AGE] learning [LANGUAGE] at [LEVEL]. Our goal is [OBJECTIVE]. For each challenge, create one practical story situation, three plausible answers with exactly one correct answer, and a short, kind explanation. Avoid trick questions. Return the plan for my approval before publishing it.

PUENTE now accepts teacher-approved six-question JSON packs, and classroom completion plants a draft automatically. The current first game remains fixed in [app.js](app.js) and [supabase/schema.sql](supabase/schema.sql); the Quest Garden's other 18 vetted questions per language are in [garden.js](garden.js). Asymmetric team clues, student roles and a connected native MOTIF solver are **not implemented**.

## Safety and scope

This is an open educational prototype, **not** a school-approved records platform. Seek school approval before using it with minors. Do not permit real names in student aliases. Do not use its scores for formal grades. Before any pilot, review accessibility and language suitability with the teacher, and establish the school's data/privacy policy. There is no open AI chat with students.

The public app includes no API secrets. Browser users may only reach room operations through the narrow authenticated RPC interface in the SQL file.

## Source files

- index.html — teacher, learner and homework screens
- styles.css — responsive layout and bridge illustration
- app.js — classroom UI, local demo, backend RPC client, homework
- garden.js — reviewed source bank, pure recombination, bounded pack schema, local library
- puzzle-engine.js — visual maze schema, pathfinding, mandatory locks, linked portals, canonical share packets
- puzzle-ui.js — phone-friendly tile editor, playtest, local shelf, teacher review and level remix
- game-lab.js — three game formats, safe Word Weave phrases, reviewed pack adaptation
- play-modes.js — mobile radio, map and word-rotation interaction controls
- next-game.js — optional Village Assembly voting, aggregate-only tally UI
- garden-ui.js — teacher review, publish gate, import/export, practice-link sharing, class-level seed generator
- config.js — blank public backend config by default
- supabase/schema.sql — dedicated-classroom backend
- supabase/garden-v2.sql — secure approved-pack upgrade, when live backend is configured
- supabase/village-assembly-v3.sql — optional teacher-only aggregates and limited student votes
- docs/GROWTH-LOOP.md — cross-repo MOTIF inspiration and falsifiable experiment plan
- .github/workflows/pages.yml — GitHub Pages deployment

The bridge is the classroom's shared achievement; the points are only playful feedback.
