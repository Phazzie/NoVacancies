import type { StoryConfig } from '$lib/contracts/story';

export const SPACE_STATION_STORY: StoryConfig = {
    id: 'space-station-crisis',
    title: 'Void Protocol',
    author: 'Jules (AI Engineer)',
    premise: 'You are the last engineer on a failing space station. Oxygen is leaking, the AI is glitching, and something is knocking on the airlock.',
    genre: 'Sci-Fi Horror',
    theme: {
        primaryColor: '#00ffff', // Cyan
        secondaryColor: '#001a1a', // Deep Space
        backgroundColor: '#000505',
        fontFamily: '"Orbitron", "Courier New", monospace'
    },
    characters: [
        {
            id: 'engineer',
            name: 'Commander Vance',
            role: 'Protagonist',
            description: 'Exhausted, wearing a torn flight suit, trying to keep the station alive.',
            referenceImagePrompt: 'A gritty sci-fi engineer in a worn spacesuit, helmet off, sweating, in a dark corridor with flickering lights.'
        },
        {
            id: 'ai',
            name: 'MOTHER',
            role: 'Station AI',
            description: 'A disembodied voice. Cold, logical, but glitching with malice.',
            referenceImagePrompt: 'A glowing red camera eye on a wall of servers, retro-futuristic style.'
        }
    ],
    openingPrompt: `
Establish the setting: Station Delta-9, orbiting a black hole.
Time: T-minus 15 minutes to critical failure.
Situation: The main reactor is offline. Oxygen is at 12%.
You (Vance) are in the Engineering deck. It is dark and cold.
You hear a metallic banging from the airlock.
MOTHER (the AI) announces: "Life support termination in progress. Have a nice day."
End with 2-3 choices for Vance to save the station or investigate the noise.
Mood: TERRIFYING / CLAUSTROPHOBIC.
`,
    mechanics: [
        {
            id: 'oxygen',
            type: 'meter',
            name: 'Oxygen Level',
            description: 'Percentage of air remaining',
            min: 0,
            max: 100,
            startValue: 12,
            visible: true
        },
        {
            id: 'hullIntegrity',
            type: 'meter',
            name: 'Hull Integrity',
            description: 'Station structural health',
            min: 0,
            max: 100,
            startValue: 45,
            visible: true
        },
        {
            id: 'aiTrust',
            type: 'meter',
            name: 'AI Cooperation',
            description: 'How much MOTHER is willing to help',
            min: 0,
            max: 10,
            startValue: 1,
            visible: true
        },
        {
            id: 'airlockOpen',
            type: 'flag',
            name: 'Airlock Breached',
            description: 'Has the thing outside gotten in?',
            startValue: false,
            visible: false
        }
    ],
    endingRules: [
        {
            id: 'suffocation',
            type: 'bad_end',
            conditions: [
                { mechanicId: 'oxygen', operator: '<=', value: 0 }
            ],
            narrativeGuidance: 'Vance runs out of air. The station goes silent. Describe the fading light.'
        },
        {
            id: 'breach',
            type: 'bad_end',
            conditions: [
                { mechanicId: 'airlockOpen', operator: '==', value: true },
                { mechanicId: 'hullIntegrity', operator: '<', value: 20 }
            ],
            narrativeGuidance: 'The entity enters. The station breaks apart. Total loss.'
        },
        {
            id: 'reboot',
            type: 'good_end',
            conditions: [
                { mechanicId: 'aiTrust', operator: '>=', value: 8 }
            ],
            narrativeGuidance: 'MOTHER resets and stabilizes the reactor. Vance survives, but is alone in the dark.'
        }
    ]
};
