/**
 * No Vacancies - Voice Reference Constants
 *
 * Single source of truth for behavioral guardrails that must reach the runtime
 * AI prompt AND the builder cartridge. Previously `behaviorSeeds` and
 * `comboStateLines` were defined only on the cartridge (index.ts) and a
 * duplicate copy was hardcoded into the SYSTEM_PROMPT, so cartridge updates
 * never reached Grok. Both consumers now import from here.
 */

import type { BehaviorSeed, ComboStateLine } from '$lib/stories/types';

export type { BehaviorSeed, ComboStateLine };

export const BEHAVIOR_SEEDS: readonly BehaviorSeed[] = Object.freeze([
	{
		incident:
			"Rides five miles for Dex's smokes, then asks Sydney to DoorDash him water because he is \"too sore\" to walk to the machine.",
		pattern: 'Selectively allocates effort based on who validates him, not who needs him.'
	},
	{
		incident:
			'Dex listens like a friend, then her private complaint comes back from somebody else with different punctuation.',
		pattern: 'Concern is the entry fee; betrayal is the operating model.'
	}
]);

export const COMBO_STATE_LINES: readonly ComboStateLine[] = Object.freeze([
	{
		when: 'When exhaustion is high and the room is still unpaid',
		line: 'She is too tired to be diplomatic and too broke to be gentle.'
	},
	{
		when: 'When Oswaldo conflict is high and awareness is still low',
		line: 'He feels accused before he feels responsible.'
	}
]);

export function formatBehaviorSeedsForPrompt(seeds: readonly BehaviorSeed[] = BEHAVIOR_SEEDS): string {
	return seeds
		.map((seed) => `- ${seed.incident} → ${seed.pattern}`)
		.join('\n');
}

export function formatComboStateLinesForPrompt(lines: readonly ComboStateLine[] = COMBO_STATE_LINES): string {
	return lines
		.map((entry) => `- ${entry.when}: "${entry.line}"`)
		.join('\n');
}
