# PUENTE — 90-second first showing

**Public home:** https://puente.abundent.org/  
**Skip straight to playable puzzle:** https://puente.abundent.org/?try=1  
**Skip straight to map editor:** https://puente.abundent.org/?workshop=1  
**Offline backup:** https://puente.abundent.org/showcase-offline.html (save a copy in advance).  

## High-school alternative: Operation Signal Heist

**Direct link:** https://puente.abundent.org/?heist=1

When showing this to high-school students or a secondary language teacher, the stronger opener is the **Signal Heist**. The mission is a small, navigable grammar-escape level: recover two encrypted signal fragments, cross an optional portal, and use advanced forms to open the extraction route. It contains three mandatory grammar gates and one optional shortcut lock. The three required gates are **typed**, not multiple-choice.

**Recommended hook:** "This isn't a vocabulary quiz. The exit won't open until you've hacked the grammar locks and recovered both signals. Find a faster route than I did."

For a quick guided tour in Spanish mode:
1. From START, go right, then up. Type **se habían ido** (accentless *se habian ido* is also accepted).
2. Go up to collect X; down twice, left, then down onto the portal.
3. Go down, then right. Type **sepa** to unlock the lower signal branch.
4. Go down to collect Y, up, right, then up. Type **por eso**.
5. Go up to reach EXIT. After the win, inspect the **personal best** and theoretical shortest route. Click **Remix this level** to expose the editor and challenge someone to improve it.

The prototype's difficulty is intentionally an **opt-in second tier**; the original `/?try=1` warm-up remains accessible for an unfamiliar adult viewer or a lower-proficiency classroom. An adult language teacher should review the grammar prompts before student use.

## The one sentence

**"The students don't just answer language questions—they build little games that teach the next students."**

## Recommended live demonstration (no sign-in, no setup)

1. **0–15 sec:** Open **Play a puzzle**. Say: "This is a map someone could have made on their phone."
2. **15–35 sec:** Tap **RIGHT** twice. The word lock stops you and asks a language question. Answer **A. The door**. Tap **RIGHT** three more times and reach the exit. Say: "The language is what makes the map work."
3. **35–60 sec:** Tap **Remix this level**. The map turns into an editor, keeping the original puzzle's ancestry. Tap the **Wall** tool and a clear floor tile that isn't on the direct corridor. Say: "Now the student becomes the designer."
4. **60–80 sec:** Tap **Test my puzzle**, solve it again, then **Send to teacher**. The app produces a portable **unapproved draft link**.
5. **80–90 sec:** Explain: "The teacher can open the draft, inspect every language answer, playtest it, and approve a player link. Another student can then remix it."

**Do not begin with the multiplayer Teacher's Desk.** Without a dedicated Supabase classroom backend, its room codes are a same-device demo only. The Workshop's standalone puzzle links, however, can already be shared across devices.

## If there is no Wi-Fi

Open the saved **showcase-offline.html** file in a browser. It contains the entire static game and opens the sample puzzle automatically without connecting to a server. An offline file can still produce a link pointing to the public site, but the recipient will need internet access to open it. Don't claim that offline phones have synchronized classroom rooms.

## The real teacher question

Don't lead with a feature catalogue. After the 90-second play-and-remix demo, ask:

**"Would your students enjoy making a puzzle for the next class—and which vocabulary unit should we prototype first?"**

The smallest useful pilot is **one adult teacher reviewing three student-authored levels** in a controlled setting. Measure: clarity of directions, language correctness, ability to create a solvable puzzle, and whether students can successfully explain the language in their own level. No student identity needs to enter PUENTE.

## Limitations to say without hesitation

- PUENTE is an **educational prototype**, not an approved student-record or learning management system.
- The in-browser teacher review is **not authenticated school approval**. The adult distributes reviewed player links through their existing trusted classroom channel.
- The standalone map editor, word locks, portals, testing, remix and self-contained links **are already playable**. Cross-phone shared classroom rooms **are not enabled** until a dedicated backend is deployed and reviewed.
- Ten authored word-lock questions are available per language. Maps can vary, but the question library is not infinitely original.
- There is no student account, student chat, or hidden generative AI inside the Workshop. A real classroom pilot should use fictional names and follow school policy.

## Pre-show checklist

Open the public **?try=1** link from the actual phone you will use; do a complete 5-move playthrough. Confirm the **Remix** and **Send to teacher** actions work. Save the offline HTML before arriving, and keep the live link ready to paste. Present the puzzle editor, not speculative MOTIF capabilities. No new cloud account or setup is needed for this first showing.

## Engineering verification

The GitHub Actions workflow runs unit tests and a **headless Chromium browser walkthrough** simulating home → first puzzle → solve → remix → draft → teacher playtest and approval → student play. The browser test also opens the bundled HTML with a **file://** URL to check the no-server backup. A successful workflow is stronger evidence than a code-only check, but does not replace a human phone rehearsal.
