# PUENTE — The Living Classroom

Chapter 001: The Broken Bridge / El Puente Roto

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
- garden-ui.js — teacher review, publish gate, import/export, practice-link sharing, class-level seed generator
- config.js — blank public backend config by default
- supabase/schema.sql — dedicated-classroom backend
- supabase/garden-v2.sql — secure approved-pack upgrade, when live backend is configured
- docs/GROWTH-LOOP.md — cross-repo MOTIF inspiration and falsifiable experiment plan
- .github/workflows/pages.yml — GitHub Pages deployment

The bridge is the classroom's shared achievement; the points are only playful feedback.
