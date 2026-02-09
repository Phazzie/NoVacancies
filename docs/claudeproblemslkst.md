1. Prompt Wiring
   PASS — grok.ts:3-9

Runtime imports and uses the full canonical prompt set: SYSTEM_PROMPT, getOpeningPrompt, getContinuePromptFromContext, getContinuePrompt, getRecoveryPrompt — all from narrative.ts.

grok.ts:179: { role: 'system', content: SYSTEM_PROMPT } — canonical system prompt wired.
grok.ts:127-148: buildScenePrompt() dispatches correctly: getOpeningPrompt() for opening, getContinuePromptFromContext() when narrativeContext is present, getContinuePrompt() as fallback.
grok.ts:259: Recovery path uses getRecoveryPrompt(first.text).
noLegacyProviderMarkers.js:22: Actively forbids the old one-liner interactive fiction engine. output json only.
No fallback to a generic system prompt exists anywhere.

2. Narrative Context
   PASS — gameRuntime.ts:254-256

NarrativeContext is built and passed during next-scene generation when narrativeContextV2 flag is active.

gameRuntime.ts:254-256: buildNarrativeContext(gameState, { lastChoiceText }) called in handleChoice().
gameRuntime.ts:257-266: Context passed through to storyService.getNextScene().
narrative.ts:406-450: buildNarrativeContext() populates all sections: recentSceneProse, olderSceneSummaries, threadNarrativeLines, boundaryNarrativeLines, lessonHistoryLines, transitionBridge.
narrative.ts:452-498: formatNarrativeContextSection() formats all sections for the prompt.
grok.ts:132-134: When narrativeContext is present, getContinuePromptFromContext() is used.
When narrativeContextV2 is off, the legacy getContinuePrompt() still includes thread state via formatThreadState(), so continuity is never zero.

ISSUE (Low) — gameRuntime.ts:214-231

Impact: startGame() does not call applyScene() — it inlines scene log / lesson tracking but skips storyThreadUpdates merge. If the AI returns thread updates on the opening scene, they're silently dropped.
Proposed fix: Either call applyScene(openingScene) for consistency, or document that opening scenes should not produce thread updates. Risk is low since opening threads start at defaults. 3) Transition Bridge Semantics
PASS — gameRuntime.ts:153-173

The lifecycle is causally correct:

gameRuntime.ts:158-161: previousThreads saved before merge.
gameRuntime.ts:163-165: mergeThreadUpdates() applies scene updates.
gameRuntime.ts:168-170: detectThreadTransitions(previousThreads, gameState.storyThreads) detects delta after merge.
Result stored as gameState.pendingTransitionBridge — consumed next turn via buildNarrativeContext() → resolveTransitionBridge().
Bridge is set after thread delta and consumed next turn. No same-turn/next-turn mismatch.

Note (informational, not a fix): If two thread dimensions shift in the same scene, detectThreadTransitions returns lines for both — but the next scene only gets one bridge consumed. If a SECOND thread shift happens on the consecutive turn, the first bridge is overwritten. This is by design (one bridge at a time) but means rapid multi-thread shifts can lose bridge context. Acceptable for current game pacing.

4. Sanity Guard Behavior
   PASS — sanity.ts:18-92

All checks confirmed:

Check Status Location
Banned phrase: "the lesson is" blocking sanity.ts:52
Banned phrase: "what this teaches us is" blocking sanity.ts:53
Banned phrase: "in the end, sydney realized" blocking sanity.ts:54
Banned phrase: "everything happens for a reason" blocking sanity.ts:55
Therapy-speak: hold space / trauma response / emotional bandwidth / nervous system blocking sanity.ts:63-71
Non-ending soft limit: 280 words retryable sanity.ts:82
Non-ending hard limit: 350 words blocking sanity.ts:80
Ending soft limit: 370 words retryable sanity.ts:77
Ending hard limit: 450 words blocking sanity.ts:74-75
Retry policy coherence in grok.ts:282-319:

maxSanityAttempts = 2
Retryable issues (only soft word limits) get one retry. Blocking issues fail immediately.
Classification is coherent with retry policy. 5) Type Safety / Shortcuts
PASS — No @ts-nocheck in any active narrative runtime file.

Checked: narrative.ts, lessons.ts, sanity.ts, grok.ts, gameRuntime.ts — all clean.

ISSUE (Minor) — grok.ts:104-107

SceneCandidate interface doesn't include sceneId, but normalizeScene() accesses it via (candidate as { sceneId?: unknown }).sceneId.
Impact: Not a safety hole — it's a narrowing cast on an undeclared-but-possible AI output field. Functionally correct but slightly untidy.
Proposed fix: Add sceneId?: unknown to SceneCandidate interface to remove the cast.
No other broad cast hacks. The mood cast at grok.ts:118 is validated by the includes() check immediately above it.

6. Test Adequacy
   PASS (structural) — noLegacyProviderMarkers.js covers:

Gemini keyword bans across src/, js/, tests/e2e/, package.json
Prompt wiring markers in grok.ts (4 required, 1 forbidden)
Runtime context wiring markers in gameRuntime.ts (2 required)
Sanity threshold markers in sanity.ts (3 required)
Voice anchor in narrative.ts (1 required)
What is still untested but high-risk:

Gap Risk Why
evaluateStorySanity() has no unit tests High Guard logic is verified only by checking the string "scene_word_count_soft_limit" exists in the file, not by calling the function. A regex edit could silently break detection.
normalizeScene() has no unit tests Medium Scene normalization handles missing fields, invalid moods, malformed choices. Edge cases could regress undetected.
buildNarrativeContext() has no unit tests Medium Context budgeting, truncation order, and translation accuracy are untested. A budget miscalculation would silently corrupt prompts.
detectThreadTransitions() has no unit tests Medium Transition detection with various before/after states is untested. Bridge map misses could cause silent narrative gaps.
Sanity retry loop (generateScene()) has no integration test Medium The interaction between retryable classification, retry count, and blocking fallthrough isn't exercised.
Feature flag defaults are untested Low If narrativeContextV2 or transitionBridges defaults change, the context pipeline silently disables.
Opening scene storyThreadUpdates dropped Low As noted in check 2, startGame() skips thread merge.
Open Questions
What are the default values of narrativeContextV2 and transitionBridges? If they default to false, the entire NarrativeContext + transition bridge pipeline is effectively off unless explicitly enabled. The runtime correctness is gated by flags that may or may not be on by default.

Is the therapy-speak blocklist considered complete? Four patterns is a start, but common AI therapy outputs like "process your feelings", "set healthy boundaries", "validate your experience" would pass through. Is expansion planned or intentionally deferred?

Is there a strategy for bridge collision? When two thread dimensions shift in one scene but a second shift happens next scene, the first bridge is overwritten before the AI ever sees it. Is this acceptable for game pacing, or should bridges accumulate?

Residual Risks
Parity checks are string-matching, not import-graph verification. If someone renames SYSTEM_PROMPT to SYSTEM_PROMPT_V2 and re-exports it, the marker check passes but wiring could break. Structural tests only prove strings exist in files, not that imports resolve correctly.

Dual continue-prompt paths. getContinuePrompt() (legacy) and getContinuePromptFromContext() (v2) are both active code paths behind a feature flag. This doubles the prompt maintenance surface. If one path gets a fix the other might not.

Context budget is aspirational, not hard-enforced. The budget trims older summaries but the policy explicitly says "Never trim lesson history, boundary lines, or thread narrative lines." If those sections grow large (many lessons encountered, many boundaries set), the budget overruns silently.

No live test of the sanity → retry → fail pipeline. The sanity guard + Grok retry loop is the most consequential runtime path and has zero test coverage. A regression here means either broken scenes reach players or valid scenes are rejected.

"What would a group of haters say about this implementation?"
"Your guard rails are vibes, not gates. You check that the STRING scene_word_count_soft_limit appears in sanity.ts but never actually call the function with a 400-word scene to prove it flags. That's testing the label on the fire extinguisher, not the extinguisher."

"You have TWO continue-prompt code paths behind a feature flag. That's twice the bug surface. Every prompt fix needs to happen in two places or you get narrative drift depending on which flag state someone deployed with. Pick one and kill the other."

"Your therapy-speak detector catches 'hold space' but misses 'you deserve to feel safe' and 'honor your boundaries.' The AI will just learn to rephrase. Four patterns is a speed bump, not a wall."

"The context budget caps at 12K chars but your SYSTEM_PROMPT alone is 11K. So you're spending ~23K chars of context window on meta-instructions before the AI writes a single word of story. Hope Grok's window is deep enough that this doesn't crowd out the actual generation quality."

"You deep-clone gameState and scenes on every access. That's defensive programming when what you need is a test that proves mutation doesn't happen. You're paying the clone tax every turn instead of writing the test that proves you don't need to."

"The storyThreadUpdates from the opening scene are silently dropped because startGame() doesn't call applyScene(). You literally wrote the machinery and then bypassed it for the first scene. If the AI ever sends opening thread state, you'll wonder why scene 2 starts at defaults."

"Your voice anchor test checks for ONE specific line: 'He will ride five miles for strangers and five inches for nobody in this room.' If someone edits that line for flow, the test breaks. If someone adds ten worse lines around it, the test passes. You're testing a bookmark, not a book."

some of this seems over engineered and not in a good way. i dont like all the heuristics and i thought we hd got rid of them. the system prompt is 11k characters? that seems steep

i need a list of actionable feedback based on all your findings and work. make a detailed list of everything i need to say make it numbered each number should contain the files that need tocuhed and what/how they need touched
The user wants me to distill all my findings into a concrete, numbered action list. Each item should specify which files need to be touched and what needs to happen. They're also flagging concerns about:

Over-engineering
Heuristics still being present (they hate heuristics)
The 11K character system prompt being too large
Let me think about what's actually actionable from the review, the user's concerns, and the file changes I've observed (Codex moved narrative context helpers to $lib/game/narrativeContext.ts, added lessons about server/client boundaries, added hydration gates).

Let me organize this into a clean numbered list.

Key areas:

The system prompt needs aggressive trimming from 11K characters. In Sanity.ts, I need to separate structural guards like word count and banned phrase detection from taste-based heuristics—the user explicitly dislikes heuristics, so I should flag which ones are essential safeguards versus which ones could be removed entirely. There's also the dual continue-prompt paths behind a feature flag that could be simplified, the opening scene skipping thread merge logic, and a few other edge cases I need to map out.

Looking at the remaining issues: SceneCandidate is missing sceneId in its interface, there are no unit tests covering sanity checks or context building functions, the context budget doesn't actually enforce limits, the therapy-speak detection list is too sparse to catch anything meaningful, and parity checks are doing string matching instead of proper import verification. The real tension is that sanity.ts itself is fundamentally heuristic-based—word counting, regex patterns, therapy-speak detection—which directly conflicts with what the user said about removing heuristics. I need to be direct about which checks are load-bearing structural requirements versus which ones are just pattern-matching that could go.

The word count and banned phrase gates serve a real purpose—they prevent the AI from writing sprawling 500-word scenes or going into lecture mode—so those are structural guardrails worth keeping. But the therapy-speak patterns and other taste-based filters are the heuristics that should probably be stripped out. The system prompt itself is bloated at 11K characters with redundant examples and emotional scaffolding across all 17 lessons that could be cut significantly. I should present this as a clear choice: keep the deterministic structural gates, remove the subjective content heuristics, and trim the prompt size down.

Now I'm building out the specific action items with exact file locations and what needs to change. Codex has already moved some functions like buildNarrativeContext and detectThreadTransitions into $lib/game/narrativeContext.ts, so I need to account for that refactoring that's already in progress. Let me focus on being precise about which files touch which problems and what the actual changes are.

Here's the actionable list.

Actionable Fixes

1. Trim the system prompt from 11K to ~6K chars

File: narrative.ts
What: The formatLessonsForPrompt() dumps all 17 lessons with title, quote, insight, emotional stakes, triggers, AND unconventional angle. That alone is ~4K chars. Cut it to title + quote only — the AI doesn't need all five fields per lesson to write a scene. Move the full lesson payloads to NarrativeContext where they're only included when a specific lesson is active. Also: the Oswaldo examples section (lines 536-567) has 30+ bullet points. Pick the 5 strongest, cut the rest. The AI gets the point after "He ate the last Hot Pocket she was saving." 2. Kill the legacy continue-prompt path

Files: narrative.ts, grok.ts, gameRuntime.ts
What: getContinuePrompt() (the old path) and getContinuePromptFromContext() (the v2 path) both exist, gated by narrativeContextV2. This is two prompt paths to maintain. If v2 is the real path, delete getContinuePrompt(), remove the feature flag gate in gameRuntime.ts:254, and always build NarrativeContext. In grok.ts:buildScenePrompt() remove the fallback branch (lines 136-147). One path, one prompt, one maintenance surface. 3. Decide what sanity.ts actually is — structural guard or taste heuristic

File: sanity.ts
What: Right now it's a mix. Word count limits (280/350/370/450) are structural — keep those. Banned phrases like "the lesson is" and "everything happens for a reason" are structural — keep those. But the therapy-speak regex list (4 patterns: "hold space", "trauma response", "emotional bandwidth", "nervous system") is a taste heuristic pretending to be a guard. Either expand it to 20+ patterns so it actually works, or delete it entirely and let Tier 2 Claude evaluation catch voice drift. Four patterns is theater, not a wall. 4. Remove the transitionBridges feature flag

Files: gameRuntime.ts, wherever normalizeFeatureFlags defines defaults
What: Same logic as #2. If transition bridges are the intended behavior, remove the flag gate. The code at gameRuntime.ts:167-173 wraps detectThreadTransitions in if (gameState.featureFlags.transitionBridges). Either bridges work or they don't — a flag that might be off makes the entire bridge pipeline dead code in some deployments. 5. Fix opening scene skipping thread merge

File: gameRuntime.ts
What: startGame() inlines scene setup but skips storyThreadUpdates merge. If the AI ever returns thread updates on the opening scene, they're silently dropped. Either call applyScene(openingScene) and remove the inline duplication, or add a comment documenting that opening scenes must not produce thread updates. Calling applyScene is cleaner — it's already written and handles all the cases. 6. Add sceneId to SceneCandidate interface

File: grok.ts
What: Add sceneId?: unknown; to the SceneCandidate interface. This removes the cast hack at lines 105-107 where it does (candidate as { sceneId?: unknown }).sceneId. One line added, two casts removed. 7. Add unit tests for the four untested core functions

New file: tests/narrative/sanity.test.js or similar
Functions to test:
evaluateStorySanity() from sanity.ts — call it with scenes at 200/290/360/400/460 words, with banned phrases, with therapy-speak, with duplicate choices. Currently only verified by checking the string exists in the file.
normalizeScene() from grok.ts — call it with missing fields, invalid moods, empty choices, malformed choice IDs.
detectThreadTransitions() from narrativeContext.ts (moved from narrative.ts) — call it with various before/after thread states, verify bridge lines match expected transitions.
buildNarrativeContext() from narrativeContext.ts — call it with empty sceneLog, oversized sceneLog, verify budget enforcement actually trims.
Why: These are the four most consequential runtime functions and none of them have a single test that actually calls them. 8. Fix context budget to actually enforce

File: narrative.ts (or wherever applyContextBudget lives now)
What: The budget trims older summaries but explicitly says "Never trim lesson history, boundary lines, or thread narrative lines." If a player encounters 15 lessons, sets 6 boundaries, and has 8 thread narrative lines, those sections alone can exceed the budget. Add a fallback: if after trimming all older summaries the budget is still exceeded, truncate the oldest lesson history lines. The "never trim" comment is aspirational — a hard cap that isn't hard isn't a cap. 9. Update parity checks after import path change

File: noLegacyProviderMarkers.js
What: The parity check at line 26 still looks for buildNarrativeContext and detectThreadTransitions in src/lib/game/gameRuntime.ts. Since the import moved to $lib/game/narrativeContext, verify the check still passes (it should — it checks the file contains the string, and the import line still has those names). But also add a parity check for src/lib/game/narrativeContext.ts itself to confirm it exports both functions. If that file gets deleted or renamed, nothing currently catches it. 10. Clean up the TRANSITION_BRIDGE_MAP coverage

File: narrative.ts (or wherever it lives now)
What: The bridge map only covers 6 specific transitions (e.g., oswaldoConflict: '0->2', '2->1'). But oswaldoConflict ranges from -2 to +2 — that's 20 possible transitions and only 2 are mapped. The rest produce changedKeys entries but no bridge lines. Either expand coverage for the most likely transitions or document which jumps intentionally have no bridge text. Right now it's ambiguous whether missing bridges are bugs or design.
Items 1-4 reduce complexity. Items 5-6 are quick fixes. Items 7-8 add real safety. Items 9-10 prevent the next regression.
