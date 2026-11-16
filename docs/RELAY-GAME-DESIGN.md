# PUENTE 006 — Relay Protocol: turning the original tutorial into a real puzzle

## Why the original wasn't enough

The original Broken Bridge was a short corridor containing a single multiple-choice vocabulary check. Its solution was almost entirely mechanical: walk to the lock, recognize an English translation, walk to the exit. The player's decisions had no meaningful consequences, and the movement didn't change the intellectual task.

The later Signal Heist had better presentation and more challenging grammar, but the core formula was still **walk → answer question → open door**. Its route and unlock conditions were mostly separate from the language.

That was not the experience to put in front of sharp high-school students.

## The new contract: a deduction game

At the center is a **six-node directed relay network**. The player controls switches A–F, and the signal must physically travel from INPUT through powered relays to OUTPUT. There is enough power to activate **exactly three** relays at a time.

An intercepted transmission provides four or five **bilingual propositional constraints**. These are not button labels or quiz choices: the player must interpret them and infer a single working network configuration. Types include:

- Exactly one of X/Y on, or X/Y in the same state.
- If X transmits, Y must transmit.
- If X is off, Y must be on.
- Not both X/Y, at least one X/Y.
- Exactly one or two of a three-relay set.

The physical routing requirement and power budget interact with the language constraints. Some combinations satisfy every grammatical statement but **do not reach the output**; others route successfully but violate the intercepted conditions.

The player must **build a configuration**, decide when to transmit, read the diagnostic response, and adjust their hypothesis. Failed transmissions increase the personal trace and lower the score, but there is no arbitrary lockout. Optional translations are explicitly counted as assisted hints.

This is a logic game using language as the rule system, not a quiz hidden inside game assets.

## Proof-carrying generation, not a promise of infinite difficulty

The engine enumerates all 64 possible six-switch configurations. It filters for exactly three live relays **and a connected INPUT–OUTPUT path**. It then builds intercepted constraints that are:

1. True for the intended solution.
2. Informative (each eliminates at least one otherwise eligible configuration).
3. **Individually necessary** for final uniqueness: removing any one clause creates ambiguity.
4. Jointly guaranteed to produce **exactly one** valid network configuration.
5. Diverse across at least three language-logic rule families.

An invariant check runs again after generation. The same numeric seed always recreates the same challenge. A compact URL contains only seed and language, no student-entered text or identity. A player can request a new randomly seeded puzzle and pass its link to someone else.

Automated tests enumerate and prove uniqueness for hundreds of variants, verify the language strings, invalid configurations, hint accounting, and actual end-to-end browser play. This is a mathematical/technical guarantee for the puzzle generation, **not evidence of measured learning gain**.

## Opening challenge and progression

The public **Break the network** CTA opens the five-rule challenge seeded from **1001** in Spanish. English is selectable. Beginner-level map activities remain available under **05 / Puzzle Workshop**, but are no longer the default pitch.

A student can win without a single hint or rejected pulse (the “Perfect Decode” result), or learn by testing hypotheses. Player-best results remain in browser localStorage only. No centralized leaderboard or competition has been deployed.

**Offline backup:** the existing one-file showcase now embeds the whole relay game and opens it without a web server. The prior editable maze and teacher-review handoff remain supported.

## Limits and next classroom test

- There are only six switches and a bounded library of statement forms; the game is more intellectually honest than the original corridor, but it is **not** an infinite general puzzle universe.
- This is local-first, source-visible JavaScript. It is for **educational practice**, not tamper-resistant grading. A determined learner could inspect its implementation or brute-force configurations.
- Automated proof of a unique solution doesn't prove the Spanish or English prompts are at the correct curricular level. An adult language teacher should check that.
- It has **not** been assessed with high-school students. Real engagement, retention, or mastery claims must come from a pilot, not a demo.
- A first pilot could ask a few students to solve one challenge while explaining their reasoning. Log only whether they can articulate the conditional statements, whether they needed translation, and which parts were confusing; do not collect identifying data in the app.

**Design threshold:** the player changes the world state to satisfy a system of constraints. Language comprehension affects what actions are logically valid. This is the meaningful change.
