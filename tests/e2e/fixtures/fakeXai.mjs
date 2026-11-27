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

globalThis.fetch = async (input, init) => {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
	if (!url.includes(XAI_HOST)) return realFetch(input, init);

	const body = JSON.parse(String(init?.body ?? '{}'));
	const prompt = JSON.stringify(body.messages ?? []);
	const content = JSON.stringify(sceneFor(prompt.includes('## OPENING SCENE')));
	return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
		status: 200,
		headers: { 'content-type': 'application/json' }
	});
};
