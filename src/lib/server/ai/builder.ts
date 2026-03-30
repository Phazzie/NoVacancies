import { generateDraftFromPremise as generateDraftFromPremiseImpl } from './builder/draftGenerator';
import { evaluateBuilderProse as evaluateBuilderProseImpl } from './builder/proseEvaluator';

export async function generateDraftFromPremise(premise: string) {
	return generateDraftFromPremiseImpl(premise);
}

export async function evaluateBuilderProse(prose: string) {
	return evaluateBuilderProseImpl(prose);
}
