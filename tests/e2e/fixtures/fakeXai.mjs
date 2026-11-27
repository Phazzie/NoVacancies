// Node preload (`node --import`) that answers xAI chat calls with deterministic scenes so
// E2E runs can drive the full server pipeline (prompting, parsing, sanity gates) offline.
// Never loaded in production: only E2E server commands pass it via NODE_OPTIONS.
const XAI_HOST = 'api.x.ai';
const ENDING_AFTER = Number(process.env.FAKE_XAI_ENDING_AFTER || 3);
const realFetch = globalThis.fetch;
let turn = 0;

const filler =
    'Sydney counts the bills twice on the bedspread while three phones buzz against the nightstand. ' +
    'Oswaldo sleeps through it. The clerk downstairs wants eighteen more dollars by eleven, and the ice machine keeps coughing like it knows.';

function sceneFor(isOpening) {
    if (isOpening) turn = 0;
    turn += 1;
    if (turn > ENDING_AFTER) {
        return {
            sceneText: `${filler} She sets the last phone face down and lets the room hold itself for once.`,
            choices: [],
            lessonId: null,
            imageKey: 'hotel_room',
            isEnding: true,
            endingType: 'exit'
        };
    }
    return {
        sceneText: `Scene ${turn}. ${filler}`,
        choices: [
            { id: `pay_rent_${turn}`, text: 'Pay the rent again' },
            { id: `wake_him_${turn}`, text: 'Wake Oswaldo up' },
            { id: `walk_out_${turn}`, text: 'Step outside for air' }
        ],
        lessonId: null,
        imageKey: 'hotel_room',
        isEnding: false,
        endingType: null
    };
}

// Builder payloads carry fixture-specific markers so tests can tell a real AI-path
// response apart from the server's fallback scaffolding.
const BUILDER_DRAFT = {
    title: 'Fixture Draft: Night Shift Ledger',
    premise:
        'A night-shift nurse covers for her brother while the hospital audits the drug cabinet.',
    setting: 'A county hospital ward at 3 AM, two weeks before the state audit.',
    aestheticStatement: "Every favor leaves a mark in somebody else's handwriting.",
    voiceCeilingLines: [
        'She initials the count sheet before she counts.',
        'Her brother texts thank you with no punctuation.',
        'The vending machine eats her last dollar and she apologizes to it.'
    ],
    characters: [
        {
            name: 'Dana',
            role: 'protagonist',
            description: 'Signs for shortages that are not hers.'
        },
        { name: 'Rick', role: 'brother', description: 'Borrows her badge and returns it warm.' }
    ],
    mechanics: [
        {
            key: 'audit_pressure',
            label: 'Audit Pressure',
            voiceMap: [
                { value: '1', line: 'She double-checks one drawer.' },
                { value: '3', line: 'She recounts the same drawer three times.' }
            ]
        },
        {
            key: 'covering',
            label: 'Covering',
            voiceMap: [
                { value: '1', line: 'She lets one late text go.' },
                { value: '3', line: 'She rewrites his shift notes in her own pen.' }
            ]
        },
        {
            key: 'sleep_debt',
            label: 'Sleep Debt',
            voiceMap: [
                { value: '1', line: 'Coffee number two.' },
                { value: '3', line: 'She reads the same chart line four times.' }
            ]
        }
    ],
    openingPrompt: 'Open on the 3 AM count, one vial short.',
    systemPrompt: 'Write behavior, not labels. Keep scenes under 300 words.'
};

const BUILDER_EVALUATION = {
    dimensionScores: {
        voiceConsistency: 8,
        behavioralSpecificity: 8,
        mechanicClarity: 7,
        promptCoherence: 8,
        repetitionRisk: 8
    },
    findings: [
        {
            severity: 'info',
            dimension: 'mechanicClarity',
            fieldKey: 'mechanic:2:0',
            message: 'Fixture finding: sleep debt low state could show behavior, not a count.'
        }
    ]
};

// Outage drill for the builder recovery spec. A premise containing OUTAGE_DRILL_MARKER walks
// this cycle: first draft call fails, retry succeeds, first QA call after that fails, QA retry
// succeeds. 400 is used because the builder client does not retry 4xx, so one failed call
// equals one failed user request. The cycle restarts, so a reused preview server still works.
const OUTAGE_DRILL_MARKER = 'outage drill';
let drillPhase = 'idle';

function contentFor(body) {
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const prompt = messages.map((m) => String(m?.content ?? '')).join('\n');
    if (prompt.includes('Generate the first draft now.')) {
        if (prompt.includes(OUTAGE_DRILL_MARKER)) {
            if (drillPhase !== 'draft_failed') {
                drillPhase = 'draft_failed';
                return null;
            }
            drillPhase = 'qa_armed';
        }
        return JSON.stringify(BUILDER_DRAFT);
    }
    if (prompt.includes('draft QA evaluator')) {
        if (drillPhase === 'qa_armed') {
            drillPhase = 'qa_failed';
            return null;
        }
        if (drillPhase === 'qa_failed') drillPhase = 'idle';
        return JSON.stringify(BUILDER_EVALUATION);
    }
    return JSON.stringify(sceneFor(prompt.includes('## OPENING SCENE')));
}

globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.includes(XAI_HOST)) return realFetch(input, init);

    const body = JSON.parse(String(init?.body ?? '{}'));
    const content = contentFor(body);
    if (content === null) {
        return new Response(JSON.stringify({ error: 'fake outage drill' }), {
            status: 400,
            headers: { 'content-type': 'application/json' }
        });
    }
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
};
