# PUENTE — MOTIF-inspired Quest Garden: Reasoning Receipt 001

Date: 2026-11-15
State: implemented finite generator; native MOTIF solver NOT RUN

## Question
Can playing a classroom game create its next useful game while retaining teacher authority, source provenance, and student privacy?

## Design loop
PLAY → OBSERVE challenge-level counts → HYPOTHESIZE focus → PROPOSE new quest → teacher REVIEW → APPROVE → PLAY AGAIN.
Proposals use deterministic bank recombination, not hidden model calls.

## Observed original sources
- MOTIF main tree: 9593b0b8e1f9e70bfc09e72adc49ee64e567609b (2026-11-15). Inspected docs/REASONING-SPINE-BRANCH-GARDEN-001.md, blob 2e01102c9ebbc9c7b9fbe9a7bd2a18a80ba23641.
- MOTIF experimental branch: experiment/reciprocal-002-two-doors-20261112, tree 34f014f12dd042cc307c05bf195d830ca4e55865. The associated PR #323 was still open and unmerged.
- Inspected experiments/reciprocal-002/README.md (blob e167913b61fddfc55fae5dc6c9f37a6081ab2892), and two_doors.js (blob 3e8ad692fd84c891a44ca3f3d8cdabe9faa086d7).
- Method tournament PR #329 was open and unmerged when inspected. It has not been executed or integrated.

The relevant transferred ideas are purpose-gated inquiry, bounded budgets, provenance, opt-in answers and an explicit stop/review rule. These are manual design references, not an operational MOTIF API. MOTIF source was neither merged nor executed.

## Rival hypotheses
- H1: a carefully authored question bank, recombined into story worlds, can improve the supply of lessons with low cost and manageable pedagogical risk.
- H2: unrestricted real-time AI could offer greater novelty but adds safety, correctness, cost and latency risks.
- H3: all-manual authoring may give highest immediate control but low production throughput.

Current implementation selects H1, permits H2 only as teacher-reviewed JSON import, and preserves H3 as a viable baseline.

## Implemented
- Bank of 18 human-authored questions for English learners and 18 for Spanish learners.
- Five worlds, six questions per adventure, subject/topic focus selected by an aggregate lowest-correctness rule when any round has at least two responses.
- Each completed teacher-led classroom session produces at most one *draft* on the teacher's device. No student aliases or individually identifiable results are stored in the growth record.
- New and imported adventure packs must pass bounded schema validation and be teacher-approved before adding them to the playable library.
- Approved packs can be played in same-device demo or, after the dedicated Supabase SQL garden-v2 upgrade, in live rooms. Homework links carry whole practice packs including answers; they are NOT secure quizzes.
- The small local library can be exported; it is not a shared cloud catalog.

## What has not been verified
- Real-world class learning or one-week retention, teaching efficacy, age suitability and language correctness of imported AI content.
- Native MOTIF algorithm results, actual MOTIF runtime execution or superiority over a strong manual classical baseline.
- True open-ended creation: a finite bank eventually repeats content. Changes of order and story are not entirely novel language tasks.
- A school-approved retention, moderation or evaluation protocol. Approval and permissions remain with the school's responsible adults.

## Discriminating next test
Teacher independently reviews five derived adventures; every correct answer and explanation must pass 6/6. Measure preparation time, prompt repetition and pedagogical value against five ordinary teacher-made lessons. If a school-approved study becomes available, compare targeted follow-up practice with a matched non-targeted control using delayed unaided probes, not clicks alone.

## Crossing card
Source: MOTIF unmerged two-doors source, inspected as HELD inspiration.
Target: PUENTE Quest Garden version 1.
Crossed: bounded question economy, explicit purpose, provenance and review authority.
Source execution: NOT_RUN. Live native integration: NOT_CONNECTED.
Implementation: local generator plus teacher-approved pack library, with optional SQL adapter committed but not applied to an external project.
Remaining HOLD: genuine pedagogy gain, independent samples, autonomous generation, student-driven world building.

## 2026-11-15 update — PUENTE 003 / Village Assembly and Three Mechanics

- Students now voluntarily select **one of three settings** and **one of three interaction forms** after restoring three bridge pieces. Revisions are allowed until class completion, and declining participation is permitted. The vote is about *game preferences*, not the truth of a historical or linguistic claim.
- The same-game-answer 0..2 classroom protocol now supports a Signal Tuner dial, a Map Navigator with destination signs, and a Word Weave sentence-rotation activity. The Word Weave questions use an additional teacher-authored three-word bank in both languages, while Signal and Map reuse existing bounded lesson prompts.
- At completion the teacher browser creates exactly one candidate quest, taking both aggregate performance by topic and aggregate game design votes into account. Teacher must still inspect all answers and explicitly approve the candidate. A finite bank does not equal endlessly new educational knowledge.
- The mobile UI modules are game-lab.js, play-modes.js and next-game.js. Student vote aggregation and row-level database security are defined in supabase/village-assembly-v3.sql, **committed but not applied to a live Supabase project**.
- GitHub Actions now runs Node checks for six-question packs, phrase rotations, cyclic choices, story-world selection, a three-piece unlock, revisable votes, student-versus-teacher visibility, and static page wiring before deployment. These are reproducible software tests, not measured learning outcomes.
- MOTIF RECIPROCAL-002 remains **unmerged research inspiration only**. There was no native MOTIF model call, training, branch execution, or autonomous content approval.

**Next informative probe:** compare student engagement and language retention between (a) the Word Weave mechanic and (b) the same word-order tasks in conventional multiple-choice form under an approved school/teacher protocol. Until measured, comparative effectiveness = HOLD.
