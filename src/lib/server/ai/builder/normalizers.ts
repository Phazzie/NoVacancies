export function normalizeLineArray(value: unknown, fallback: string[]): string[] {
	if (!Array.isArray(value)) return fallback;
	return value.filter((line): line is string => typeof line === 'string' && line.trim().length > 0);
}

export function titleCase(value: string): string {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

export function deriveTitleFromPremise(premise: string): string {
	const cleaned = premise.replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
	if (!cleaned) return 'Untitled Story';
	const words = cleaned.split(' ').slice(0, 4).join(' ');
	return titleCase(words);
}

export function deriveSettingFromPremise(premise: string): string {
	const lowered = premise.toLowerCase();
	if (lowered.includes('hotel')) return 'A hotel room with the bill coming due before anybody is ready.';
	if (lowered.includes('office')) return 'An office that looks orderly until the social debt comes due.';
	if (lowered.includes('house')) return 'A house where maintenance and obligation have become the same job.';
	return 'A pressure-cooker setting where the protagonist keeps absorbing the cost of everyone else being unfinished.';
}
