import { generateDraftFromPremise as generateDraftFromPremiseInternal } from './builder/draftGenerator';
import { evaluateBuilderProse as evaluateBuilderProseInternal } from './builder/proseEvaluator';

export async function generateDraftFromPremise(premise: string) {
	return generateDraftFromPremiseInternal(premise);
}

export async function evaluateBuilderProse(prose: string) {
	return evaluateBuilderProseInternal(prose);
}
