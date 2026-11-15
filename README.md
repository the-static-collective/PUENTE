# PUENTE — The Living Classroom

Chapter 001: The Broken Bridge / El Puente Roto

A bilingual, cooperative classroom game for phones. Teachers host a room; learners join with a classroom code; a correct class answer earns each plank of the bridge. If nobody gets a round right, the class discusses and retries.

**Repository:** https://github.com/the-static-collective/PUENTE  
**Expected website:** https://the-static-collective.github.io/PUENTE/

## Playable features

- Teacher's desk: create a room, show a code, start the adventure, reveal and explain answers, advance six challenges, see explorer counts/scores.
- Student portal: join with a fictional alias, answer once per round, see teacher's reveal.
- A classroom bridge illustration that gradually rebuilds.
- Homework: five self-paced puzzles with immediate feedback. Homework scores are not stored centrally.
- Switch between Spanish-learning and English-learning.
- Same-device demo: works with no backend, including two tabs on one browser.

**Important:** This site launches in LOCAL DEMO mode. Demo rooms use local browser storage and therefore do **not** connect different phones. For a real multi-device classroom, configure Supabase as described below.

## Publish the website

1. Open repository Settings → Pages and choose GitHub Actions as the build/deploy source.
2. Open repository Actions and inspect the workflow named Publish PUENTE to GitHub Pages. It triggers on pushes to main; use Run workflow if needed.
3. Open https://the-static-collective.github.io/PUENTE/ and look for LOCAL DEMO.
4. On the teacher screen, create a room, start the adventure, press Send demo answer on each round, and reveal answers. Open the Student portal in another tab in the **same browser** to join it.

No build tools or subscription are required to serve the site from GitHub Pages.

## Activate cross-phone live play

Create a **dedicated Supabase project for PUENTE**. Do not mix children's classroom data into existing unrelated projects.

1. Enable Anonymous Sign-Ins in that project's Authentication provider settings. Review CAPTCHA and rate limits before classroom use.
2. Review and execute the SQL in [supabase/schema.sql](supabase/schema.sql) in that dedicated project's SQL editor. It creates three locked-down public tables, a private question bank, and five controlled RPC functions.
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

The current question set is fixed in both [app.js](app.js) for demo/homework and [supabase/schema.sql](supabase/schema.sql) for live play. Custom teacher-approved JSON quest packs, asymmetric team clues, student roles, and MOTIF-generated lesson hypotheses are **planned, not yet implemented**.

## Safety and scope

This is an open educational prototype, **not** a school-approved records platform. Seek school approval before using it with minors. Do not permit real names in student aliases. Do not use its scores for formal grades. Before any pilot, review accessibility and language suitability with the teacher, and establish the school's data/privacy policy. There is no open AI chat with students.

The public app includes no API secrets. Browser users may only reach room operations through the narrow authenticated RPC interface in the SQL file.

## Source files

- index.html — teacher, learner and homework screens
- styles.css — responsive layout and bridge illustration
- app.js — classroom UI, local demo, backend RPC client, homework
- config.js — blank public backend config by default
- supabase/schema.sql — dedicated-classroom backend
- .github/workflows/pages.yml — GitHub Pages deployment

The bridge is the classroom's shared achievement; the points are only playful feedback.
