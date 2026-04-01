import { generateDraftFromPremise as generateDraftFromPremiseInternal } from './builder/draftGenerator';
import { evaluateBuilderProse as evaluateBuilderProseInternal } from './builder/proseEvaluator';
import { evaluateBuilderDraft as evaluateBuilderDraftInternal } from './builder/draftEvaluator';

export async function generateDraftFromPremise(premise: string) {
return generateDraftFromPremiseInternal(premise);
}

export async function evaluateBuilderProse(prose: string) {
return evaluateBuilderProseInternal(prose);
}

export async function evaluateBuilderDraft(draft: Parameters<typeof evaluateBuilderDraftInternal>[0]) {
return evaluateBuilderDraftInternal(draft);
}
