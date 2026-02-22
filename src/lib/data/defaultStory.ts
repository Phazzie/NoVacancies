import type { StoryConfig } from '../contracts/story';

export const NO_VACANCIES_STORY: StoryConfig = {
	id: 'no-vacancies',
	title: 'No Vacancies',
	author: 'Anthropic & Google',
	premise: 'A tense morning in a motel room where the bills are due and relationships are fraying.',
	genre: 'Domestic Thriller / Slice of Life',
	theme: {
		primaryColor: '#ff4d4d', // Reddish tension
		secondaryColor: '#1a1a1a', // Dark background
		backgroundColor: '#000000',
		fontFamily: 'Courier New, monospace'
	},
	characters: [
		{
			id: 'sydney',
			name: 'Sydney',
			role: 'Protagonist',
			description: 'Tired, anxious, holding it all together. She is the only one awake.',
			referenceImagePrompt: 'A tired woman in her late 20s, sitting on a motel bed, messy hair, looking at a laptop, morning light.'
		},
		{
			id: 'oswaldo',
			name: 'Oswaldo',
			role: 'Partner',
			description: 'Asleep, unreliable, source of tension.',
			referenceImagePrompt: 'A man sleeping on a motel bed, messy sheets, morning light.'
		},
		{
			id: 'trina',
			name: 'Trina',
			role: 'Friend/Dependent',
			description: 'Crashed on the floor, asleep.',
			referenceImagePrompt: 'A person sleeping on the floor of a motel room, messy.'
		}
	],
	openingPrompt: `
Establish the time (6:47 AM), place (motel room), and situation (7, need 5 by 11 AM).
Show Oswaldo sleeping, Trina crashed on the floor.
Convey Sydney's isolation - she's the only one awake, the only one who knows how close everything is to falling apart.
He will ride five miles for strangers and five inches for nobody in this room.
End with 2-3 distinct choices for how Sydney approaches this morning.
Final sentence must create immediate player agency tension ("What do you do right now?").
Set the mood as TENSE.
`,
	mechanics: [
		{
			id: 'pressure',
			type: 'meter',
			name: 'Pressure',
			description: 'The rising tension of the situation',
			min: 0,
			max: 100,
			startValue: 10,
			visible: true
		},
		{
			id: 'oswaldoConflict',
			type: 'meter',
			name: 'Oswaldo Conflict',
			description: 'How angry/awake Oswaldo is',
			min: 0,
			max: 10,
			startValue: 0,
			visible: false
		},
		{
			id: 'moneyResolved',
			type: 'flag',
			name: 'Money Secured',
			description: 'Has Sydney found the money?',
			startValue: 0,
			visible: true
		},
		{
			id: 'boundariesSet',
			type: 'set',
			name: 'Boundaries Set',
			description: 'List of boundaries Sydney has established',
			startValue: [],
			visible: false
		}
	],
	endingRules: [
		{
			id: 'exit',
			type: 'exit',
			conditions: [
				{ mechanicId: 'oswaldoConflict', operator: '>', value: 8 }
			],
			narrativeGuidance: 'Sydney should leave into uncertainty, debt pressure, and emotional fallout. Not relief.'
		},
		{
			id: 'shift',
			type: 'shift',
			conditions: [],
			narrativeGuidance: 'Sydney should set one boundary, and the room should immediately test it.'
		}
	],
	legacyMode: true
};

export const DEFAULT_STORY_ID = 'no-vacancies';
