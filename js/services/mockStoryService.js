/**
 * No Vacancies - Mock Story Service
 * 
 * Provides pre-written scenes for testing without AI.
 * Contains paths to all 4 endings:
 * - LOOP: Nothing changes, but she's awake to it now
 * - SHIFT: Small boundaries, uncomfortable but hopeful  
 * - EXIT: She leaves, uncertain but lighter
 * - RARE: Oswaldo says "I see what would break if you weren't here"
 */

import { EndingTypes, ImageKeys, Moods } from '../contracts.js';

/**
 * All mock scenes organized by ID
 * @type {Object.<string, import('../contracts.js').Scene>}
 */
const scenes = {
    // ============================================
    // OPENING SCENE
    // ============================================
    opening: {
        sceneId: 'opening',
        sceneText: `6:47 AM. The motel room smells like stale cigarettes and cold pizza. You've been awake for twenty minutes, staring at the phone in your hand.

$47. That's what you've got. The room is $65, due by 11 AM.

Oswaldo is still asleep, dead to the world—probably will be until 2 PM. Trina's on the floor in the corner, passed out under a blanket that used to be yours. Somewhere in the last week, she stopped being a guest.

You need $18 in four hours. Nobody in this room is going to help you get it. They never have. But somehow, the room always gets paid. Somehow, you always figure it out.

The question is: what's the move today?`,
        choices: [
            {
                id: 'work_laptop',
                text: 'Get to work on the laptop. Same hustle, different day.',
                nextSceneId: 'work_early'
            },
            {
                id: 'wake_oswaldo',
                text: 'Wake Oswaldo up. Tell him you need help.',
                nextSceneId: 'wake_oswaldo'
            },
            {
                id: 'just_sit',
                text: 'Just sit with this feeling for a minute.',
                nextSceneId: 'sit_reflect'
            }
        ],
        lessonId: 1, // Load-bearing beams
        imageKey: ImageKeys.HOTEL_ROOM,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    // ============================================
    // WORK PATH
    // ============================================
    work_early: {
        sceneId: 'work_early',
        sceneText: `You pull the laptop onto your lap, navigate around the half-empty Starbucks cups and DoorDash containers. The screen's glow is the only real light in here.

By 8:30, you've got a card running. It's a waiting game now.

At 9:15, the card clears. $200 loaded onto a prepaid. You feel that familiar mix of relief and... nothing. No one will know how close it was. No one will understand the three hours of quiet precision it took.

You hear Oswaldo stir. He mumbles something. Checks his phone. Doesn't look at you.

The room is paid for another day. Crisis averted. Again.`,
        choices: [
            {
                id: 'tell_oswaldo_work',
                text: 'Tell Oswaldo what you just did. Make him see it.',
                nextSceneId: 'confront_oswaldo'
            },
            {
                id: 'stay_quiet',
                text: 'Stay quiet. What\'s the point?',
                nextSceneId: 'stay_quiet_loop'
            },
            {
                id: 'set_boundary',
                text: 'Set a small boundary. "I need you to get food today. I can\'t do everything."',
                nextSceneId: 'set_boundary'
            }
        ],
        lessonId: 6, // Invisibility of competence
        imageKey: ImageKeys.SYDNEY_LAPTOP,
        isEnding: false,
        endingType: null,
        mood: Moods.NEUTRAL
    },

    // ============================================
    // WAKE OSWALDO PATH
    // ============================================
    wake_oswaldo: {
        sceneId: 'wake_oswaldo',
        sceneText: `"Oswaldo." You shake his shoulder. "Oswaldo, I need to talk to you."

He groans, pulls the pillow over his head. "What time is it?"

"Not two PM, so I know you don't care. But I'm $18 short for the room and I need—"

"You'll figure it out." His voice is muffled by the pillow. "You always do."

He rolls over, away from you. The conversation is over before it started.

You stand there, the words 'you'll figure it out' hanging in the air like a verdict.`,
        choices: [
            {
                id: 'push_harder',
                text: 'Push harder. "No. You need to hear me. I\'m drowning."',
                nextSceneId: 'push_harder'
            },
            {
                id: 'give_up_work',
                text: 'Give up. Go work. Handle it yourself. Again.',
                nextSceneId: 'work_early'
            },
            {
                id: 'let_it_fail',
                text: 'Don\'t fix it. Let noon come. See what happens.',
                nextSceneId: 'let_fail'
            }
        ],
        lessonId: 8, // Asking for help doesn't work
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    // ============================================
    // REFLECTION PATH
    // ============================================
    sit_reflect: {
        sceneId: 'sit_reflect',
        sceneText: `You sit on the edge of the bed, staring at nothing.

When did this become normal? The math you do in your head every morning—whose needs, whose bills, whose problems. The mental load you carry while everyone else sleeps.

Trina will wake up hungry. Eat something you bought. Ask why there's nothing else. Oswaldo will surface around noon, ask "what'd you do today?" like you've been relaxing.

You are so tired of being the only one who knows how close everything is to falling apart.

And the worst part? If you weren't here, they'd figure it out. They'd HAVE to. But because you're here...`,
        choices: [
            {
                id: 'realize_pattern',
                text: 'You\'re the reason they don\'t have to. Keep thinking.',
                nextSceneId: 'realize_pattern'
            },
            {
                id: 'snap_out',
                text: 'Snap out of it. Work to do.',
                nextSceneId: 'work_early'
            },
            {
                id: 'confront_self',
                text: 'Ask yourself the real question: What am I to them?',
                nextSceneId: 'what_am_i'
            }
        ],
        lessonId: 4, // Your energy keeps it alive
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    // ============================================
    // CONFRONTATION SCENES
    // ============================================
    confront_oswaldo: {
        sceneId: 'confront_oswaldo',
        sceneText: `"I just made $200," you say, louder than you meant to. "While you were sleeping. I've been up since before 7 handling this, like I always do."

Oswaldo blinks at you. For a second, you think maybe he'll see it.

"Okay?" He shrugs. "That's... good? I don't know why you gotta make it a thing."

"Because you never even ask! You never—"

"Why do you always keep score?" He's defensive now. "I help with the energy around here. I support you emotionally. Not everything has to be about money."

The hotel clerk doesn't accept 'emotional support' as payment. But you don't say that.`,
        choices: [
            {
                id: 'keep_fighting',
                text: 'Keep fighting. Make him understand somehow.',
                nextSceneId: 'fight_escalate'
            },
            {
                id: 'go_silent',
                text: 'Go silent. You\'ve said this before. It doesn\'t change.',
                nextSceneId: 'stay_quiet_loop'
            },
            {
                id: 'try_different',
                text: 'Try a different approach: "What would change if I wasn\'t here?"',
                nextSceneId: 'pivot_question'
            }
        ],
        lessonId: 9, // Discomfort becomes attacks
        imageKey: ImageKeys.SYDNEY_FRUSTRATED,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    push_harder: {
        sceneId: 'push_harder',
        sceneText: `"No." Your voice cracks. "You need to hear me. I'm drowning here."

Oswaldo sits up, annoyed now. "You're always saying that, and then you handle it. What do you want me to do?"

"I want you to TRY. To actually help. To notice that I'm the only one keeping this whole thing together!"

"See, this is why I don't like waking up early. You're always in some kind of mood." He grabs his phone. "You're being controlling right now."

Controlling. You're CONTROLLING because you want help paying for the room YOU pay for every single day.`,
        choices: [
            {
                id: 'speechless',
                text: 'Say nothing. What is there left to say?',
                nextSceneId: 'speechless_exit'
            },
            {
                id: 'last_shot',
                text: 'One last shot: "If I left right now, what would you do?"',
                nextSceneId: 'what_would_you_do'
            },
            {
                id: 'just_work',
                text: 'Walk away. Get to work. The room won\'t pay itself.',
                nextSceneId: 'work_defeated'
            }
        ],
        lessonId: 3, // Resentment toward the load-bearer
        imageKey: ImageKeys.SYDNEY_FRUSTRATED,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    // ============================================
    // LET IT FAIL PATH
    // ============================================
    let_fail: {
        sceneId: 'let_fail',
        sceneText: `You don't fix it.

10:45 AM comes. The room still isn't paid. You sit in the chair, watching. Waiting.

At 11:15, there's a knock. Management.

"Oh shit." Oswaldo actually wakes up now. Trina's scrambling. "Syd, are we good? Did you—why didn't you—"

For the first time in months, they're both looking at you. Actually seeing you. Because the floor fell out.

"I didn't handle it," you say. "I let you see what happens when I don't."`,
        choices: [
            {
                id: 'watch_them_scramble',
                text: 'Watch them scramble. Don\'t help.',
                nextSceneId: 'reality_hits'
            },
            {
                id: 'bail_out_again',
                text: 'Bail them out again. Old habits.',
                nextSceneId: 'bail_out'
            },
            {
                id: 'walk_out',
                text: 'Walk out. The door is right there.',
                nextSceneId: 'exit_door'
            }
        ],
        lessonId: 12, // Making effort legible
        imageKey: ImageKeys.THE_DOOR,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    // ============================================
    // DEEP REFLECTION SCENES
    // ============================================
    realize_pattern: {
        sceneId: 'realize_pattern',
        sceneText: `The thought crystallizes:

You are the oxygen. Without you, this whole thing suffocates.

But here's the cruel part—they've adapted to breathe you. They don't even know they're doing it. Oswaldo isn't evil. He's just... adjusted to a world where Sydney handles things.

You've trained them. By being reliable. By smoothing everything. By not letting them feel the consequences of their own choices.

What's the phrase? You're not causing problems. You're preventing them. And no one notices prevention.

Only failure is visible.`,
        choices: [
            {
                id: 'test_theory',
                text: 'Test the theory. Stop preventing. See what breaks.',
                nextSceneId: 'let_fail'
            },
            {
                id: 'start_leaving',
                text: 'Start leaving. Quietly. Piece by piece.',
                nextSceneId: 'quiet_exit'
            },
            {
                id: 'one_more_try',
                text: 'Give them one more chance. Talk to Oswaldo for real.',
                nextSceneId: 'real_talk'
            }
        ],
        lessonId: 14, // The system only responds to load distribution
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    what_am_i: {
        sceneId: 'what_am_i',
        sceneText: `The question hits you like cold water:

If my presence doesn't change how Oswaldo acts, plans, or sacrifices... what am I to him?

Not a partner. A partner changes things. A partner makes you recalculate.

But Oswaldo hasn't changed anything. He doesn't factor you into his plans because he knows—KNOWS without thinking—that you'll be the one who factors.

You're not a person to him. You're an assumption.

A stability that erases evidence of effort.

An infrastructure.`,
        choices: [
            {
                id: 'confront_this',
                text: 'Confront him with this. "What am I to you?"',
                nextSceneId: 'the_question'
            },
            {
                id: 'accept_it',
                text: 'Accept it. Nothing will change, but at least you see it now.',
                nextSceneId: 'ending_loop'
            },
            {
                id: 'start_changing',
                text: 'Start changing the equation. Today.',
                nextSceneId: 'set_boundary'
            }
        ],
        lessonId: 17, // What am I to you?
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    // ============================================
    // THE QUESTION PATH (leads to RARE ending)
    // ============================================
    the_question: {
        sceneId: 'the_question',
        sceneText: `You wait until Oswaldo is awake. Really awake. When he asks "we got money for the room?" you don't answer.

Instead, you ask:

"Oswaldo. If I left right now. If I just... walked out that door and never came back. What would change for you?"

He laughs. But it dies quick when he sees your face.

"What are you talking about?"

"I'm asking what would break. What you'd have to suddenly deal with yourself. What I carry that you don't even see."

The silence stretches. For once, he doesn't have a quip.`,
        choices: [
            {
                id: 'press_silence',
                text: 'Wait. Let the silence do the work.',
                nextSceneId: 'silence_works'
            },
            {
                id: 'fill_silence',
                text: 'Fill the silence. He\'s not going to get it.',
                nextSceneId: 'give_up_loop'
            },
            {
                id: 'list_it',
                text: 'List it out. "The room. The food. The hotspot. The plans. Me."',
                nextSceneId: 'list_everything'
            }
        ],
        lessonId: 10, // What you actually want to hear
        imageKey: ImageKeys.SYDNEY_FRUSTRATED,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    silence_works: {
        sceneId: 'silence_works',
        sceneText: `You don't fill the silence. You just watch him.

And something happens. Something you've never seen before.

His face changes. It's like he's actually doing the math for the first time. Actually thinking about what you do. What you carry.

"I..." He starts. Stops. Starts again.

"I think... I don't know how much you hold up. Like, I genuinely don't know." He rubs his face. "It's not that I don't care, it's—I just never had to know."

"Because I never let you have to."

"Yeah." He looks at you. Really looks. "I see that now. I see what would break if you weren't here."`,
        choices: [
            {
                id: 'accept_rare',
                text: '"You do?"',
                nextSceneId: 'ending_rare'
            }
        ],
        lessonId: 10, // What you actually want to hear
        imageKey: ImageKeys.OSWALDO_AWAKE,
        isEnding: false,
        endingType: null,
        mood: Moods.HOPEFUL
    },

    list_everything: {
        sceneId: 'list_everything',
        sceneText: `"The room," you start. "Every day. $65 a day, which means I need to make $65 a day. Which means I'm working before you wake up and after you fall asleep.

"The food. The hotspot. The DoorDash. The electricity—you think it's free because I pay it before it's off.

"The planning. The thinking three days ahead so we're never out. The stress you never feel because I feel it FOR you.

"That's what I carry, Oswaldo. Every single day."

He's quiet. Then:

"I help with—"

"If you say 'the energy,' I swear to god."`,
        choices: [
            {
                id: 'he_gets_it',
                text: 'Let him respond.',
                nextSceneId: 'rare_hope'
            }
        ],
        lessonId: 11, // See it AND act accordingly
        imageKey: ImageKeys.SYDNEY_FRUSTRATED,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    // ============================================
    // BOUNDARY PATH (leads to SHIFT ending)
    // ============================================
    set_boundary: {
        sceneId: 'set_boundary',
        sceneText: `"I need you to get food today."

Oswaldo blinks. "What?"

"I made the money. You get the food. I can't do everything."

It feels strange in your mouth. Like speaking a foreign language. But you hold the line.

"I mean... I guess I could order Door—"

"No. Go OUT. Walk there. Handle it yourself."

The silence that follows is deeply uncomfortable. This isn't how things work here. You KNOW he's thinking it. But you don't budge.

"Fine." He says it with an edge. But he says it.`,
        choices: [
            {
                id: 'watch_boundary',
                text: 'Watch what happens. Hold the boundary.',
                nextSceneId: 'boundary_holds'
            },
            {
                id: 'soften',
                text: 'Soften. "Or I can..."—old habits die hard.',
                nextSceneId: 'bail_out'
            }
        ],
        lessonId: 14, // The system only responds to load distribution
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: false,
        endingType: null,
        mood: Moods.HOPEFUL
    },

    boundary_holds: {
        sceneId: 'boundary_holds',
        sceneText: `He actually goes out.

It takes him two hours. He complains when he gets back. Says the store didn't have what he wanted. Blames you for not ordering delivery.

But he went.

It's small. It's uncomfortable. It's awkward as hell. But something shifted. Not because he understood—he doesn't. He's annoyed.

But he did it. And you didn't. And the world didn't end.

Maybe that's how it starts. Not with understanding. With redistribution.`,
        choices: [
            {
                id: 'accept_shift',
                text: 'Accept this small victory. It\'s a beginning.',
                nextSceneId: 'ending_shift'
            }
        ],
        lessonId: 12, // Making effort legible
        imageKey: ImageKeys.HOTEL_ROOM,
        isEnding: false,
        endingType: null,
        mood: Moods.HOPEFUL
    },

    // ============================================
    // EXIT PATH
    // ============================================
    quiet_exit: {
        sceneId: 'quiet_exit',
        sceneText: `You start packing. Not all at once—that would be dramatic. Just... your essentials. The laptop. The real charger, not the backup one. Your ID. The cash you'd hidden in the lining of your bag.

Nobody notices. Of course they don't.

By the time Trina wakes up asking about lunch, you're halfway to a decision you've been avoiding for years.

The door is right there. It's always been right there.`,
        choices: [
            {
                id: 'take_door',
                text: 'Take it. Walk out.',
                nextSceneId: 'exit_door'
            },
            {
                id: 'hesitate',
                text: 'Hesitate. What if things could be different?',
                nextSceneId: 'one_more_try'
            }
        ],
        lessonId: 4, // Your energy keeps it alive
        imageKey: ImageKeys.THE_DOOR,
        isEnding: false,
        endingType: null,
        mood: Moods.NEUTRAL
    },

    exit_door: {
        sceneId: 'exit_door',
        sceneText: `You open the door. Real sunlight hits your face—not the filtered stuff through motel blinds.

"Syd? Where you going?"

You don't turn around. "Out."

"You coming back?"

That's the question, isn't it? You've always come back. Holding the pieces. Paying the bills. Being the beam that never cracks.

But beams can walk away. You didn't know that until just now.

"I don't know," you say honestly.

And you keep walking.`,
        choices: [
            {
                id: 'keep_walking',
                text: 'Keep walking. Don\'t look back.',
                nextSceneId: 'ending_exit'
            }
        ],
        lessonId: 16, // Relationships are about risk reduction
        imageKey: ImageKeys.MOTEL_EXTERIOR,
        isEnding: false,
        endingType: null,
        mood: Moods.HOPEFUL
    },

    // ============================================
    // LOOP PATH
    // ============================================
    stay_quiet_loop: {
        sceneId: 'stay_quiet_loop',
        sceneText: `You stay quiet. What's the point?

The room gets paid. Trina asks what's for dinner. Oswaldo plays on his phone until 3 AM, and somewhere in there he says "thanks babe" for something you don't even remember doing.

Tomorrow will be the same. $65. You'll figure it out.

But something is different now. You see it. The invisible weight you carry. The infrastructure you've become.

Maybe that's enough. Maybe seeing clearly is the first step, even if nothing else changes.

Or maybe it's just another thing you'll carry alone.`,
        choices: [
            {
                id: 'accept_loop',
                text: 'Accept it. At least you\'re awake now.',
                nextSceneId: 'ending_loop'
            }
        ],
        lessonId: 6, // Invisibility of competence
        imageKey: ImageKeys.SYDNEY_LAPTOP,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    give_up_loop: {
        sceneId: 'give_up_loop',
        sceneText: `You don't have the energy for this fight. Not again.

"Never mind," you say. "Forget I asked."

Oswaldo shrugs, already back on his phone. The moment passes like it always does.

You work. You pay the room. You answer Trina's question about dinner. You exist in this space that needs you but doesn't see you.

The only thing that's changed is you. You can't unsee it anymore.

The weight is still invisible to them. But it's not invisible to you anymore.`,
        choices: [
            {
                id: 'accept_awareness',
                text: 'Keep going. Different now that you know.',
                nextSceneId: 'ending_loop'
            }
        ],
        lessonId: 2, // They don't understand the concept
        imageKey: ImageKeys.SYDNEY_LAPTOP,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    // ============================================
    // MISSED ENDINGS (RESCUE SCENES)
    // ============================================
    bail_out: {
        sceneId: 'bail_out',
        sceneText: `You bail them out. Again. Because what else would you do?

The room gets paid. The problem gets fixed. Everyone relaxes back into their comfortable positions—Oswaldo on his phone, Trina eating your food.

You feel something die a little inside. Not the relationship. Not the situation. Just a small piece of hope.

Maybe next time, you think. Maybe tomorrow you'll be stronger.

But you know how this story goes.`,
        choices: [
            {
                id: 'loop_acceptance',
                text: 'Accept the cycle. At least you see it now.',
                nextSceneId: 'ending_loop'
            }
        ],
        lessonId: 13, // Won't vs Can't
        imageKey: ImageKeys.HOTEL_ROOM,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    reality_hits: {
        sceneId: 'reality_hits',
        sceneText: `You watch them scramble.

Trina's asking Oswaldo for cash he doesn't have. Oswaldo is suddenly very angry—at you, at the situation, at the management knocking on the door.

"Why didn't you TELL us?" he demands.

"I've been telling you. Every day. You just didn't hear it because I fixed it before you had to."

The manager is patient. An hour extension.

In that hour, you watch Oswaldo actually TRY. Make calls. Hustle. Find $40 somewhere you didn't know existed.

Not enough. But something.`,
        choices: [
            {
                id: 'combine_funds',
                text: 'Combine your money and his. Cover it together for once.',
                nextSceneId: 'rare_hope'
            },
            {
                id: 'leave_anyway',
                text: 'Leave anyway. One hour of effort doesn\'t erase months.',
                nextSceneId: 'exit_door'
            }
        ],
        lessonId: 12, // Making effort legible
        imageKey: ImageKeys.OSWALDO_AWAKE,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    rare_hope: {
        sceneId: 'rare_hope',
        sceneText: `Something shifts in Oswaldo's face. The defensiveness drains out. For a second, he looks... small.

"I didn't know," he says quietly. "I mean—I knew, but I didn't KNOW know. This is what you deal with? Every day?"

"Every day."

"And I just..." He trails off. Rubs his face. "I've been such a piece of shit."

"Yes."

"I'm sorry. Not just—I mean, I SEE it now. What you do. What would break if you stopped." He swallows. "I see what would break if you weren't here."

You've waited so long to hear those words.`,
        choices: [
            {
                id: 'believe_him',
                text: 'Let yourself believe him.',
                nextSceneId: 'ending_rare'
            }
        ],
        lessonId: 10, // What you actually want to hear
        imageKey: ImageKeys.OSWALDO_AWAKE,
        isEnding: false,
        endingType: null,
        mood: Moods.HOPEFUL
    },

    // ============================================
    // ENDINGS
    // ============================================
    ending_loop: {
        sceneId: 'ending_loop',
        sceneText: `Nothing changes. Not really.

Tomorrow you'll wake up at 6:47 AM. You'll count the money. You'll do the math. You'll carry the weight while everyone around you sleeps.

But something IS different now. You can see it. The invisible structure you've become. The load-bearing beam that gets leaned on, not applauded.

They still don't understand. Maybe they never will.

But you understand. And maybe that's where it starts.

The exhaustion is the same. But it's not invisible anymore. Not to you.

And maybe, someday, that seeing will become doing.

**ENDING: THE LOOP**
*Nothing changed. But you're awake now.*`,
        choices: [],
        lessonId: 1, // Load-bearing beams
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: true,
        endingType: EndingTypes.LOOP,
        mood: Moods.DARK
    },

    ending_shift: {
        sceneId: 'ending_shift',
        sceneText: `It's not a revolution. It's a nudge.

Oswaldo went to the store. It took two hours and he complained the whole way back. Tomorrow he'll probably go back to normal.

But you held the line. You redistributed one tiny piece of weight. And the world didn't end.

There's a long road ahead. One where you keep asking for small things. Keep not doing things you usually do. Keep letting friction happen.

It's uncomfortable. It's awkward. But it's honest.

For the first time in years, the system felt a different distribution. And that's how change starts.

Not with understanding. With load.

**ENDING: THE SHIFT**
*Small boundaries. Uncomfortable but hopeful.*`,
        choices: [],
        lessonId: 14, // The system only responds to load distribution
        imageKey: ImageKeys.HOTEL_ROOM,
        isEnding: true,
        endingType: EndingTypes.SHIFT,
        mood: Moods.HOPEFUL
    },

    ending_exit: {
        sceneId: 'ending_exit',
        sceneText: `You keep walking.

Past the parking lot. Past the rusted ice machine. Past the neon sign that says VACANCY in buzzing pink letters.

You don't know where you're going. A shelter, maybe. A friend's couch. The bus station. Somewhere that isn't a $65-a-day trap where you're the only one keeping the lights on.

Behind you, you hear Oswaldo yell something. You don't turn around.

Load-bearing beams don't get applause. They get leaned on.

But they can also walk away.

The road stretches ahead. Empty. Uncertain. Terrifying.

And lighter.

**ENDING: THE EXIT**
*You left. You don't know where. But you're not carrying them anymore.*`,
        choices: [],
        lessonId: 17, // What am I to you?
        imageKey: ImageKeys.MOTEL_EXTERIOR,
        isEnding: true,
        endingType: EndingTypes.EXIT,
        mood: Moods.HOPEFUL
    },

    ending_rare: {
        sceneId: 'ending_rare',
        sceneText: `"I see what would break if you weren't here."

You've waited so long to hear someone say it. Actually say it. Not a thank you—thank yous are cheap. But SEEING. Witnessing.

Oswaldo doesn't transform overnight. He's not suddenly going to wake up at 7 AM and start hustling. People don't work that way.

But something cracked open. He SAW it, for a moment. The invisible architecture you've built. The weight you carry.

Whether he acts on it—whether this moment becomes something real—that's tomorrow's question.

But today? Today someone finally said:

"I see what would break if you weren't here."

And that's all you ever wanted.

**ENDING: THE RARE**
*He saw it. He actually saw it.*`,
        choices: [],
        lessonId: 10, // What you actually want to hear
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: true,
        endingType: EndingTypes.RARE,
        mood: Moods.TRIUMPHANT
    },

    // ============================================
    // ADDITIONAL CONNECTING SCENES
    // ============================================
    fight_escalate: {
        sceneId: 'fight_escalate',
        sceneText: `"Energy doesn't pay the rent, Oswaldo! Your ENERGY doesn't keep the lights on!"

"See? This is what I mean. Why do you always have to be like this?"

"Like WHAT? Like the only person in this room who makes anything happen?"

He's on his feet now. Trina's pretending to be asleep. The walls are thin and you don't care.

"You act like you're the only one who does anything!"

"I AM the only one who does anything! That's the PROBLEM!"

The words are out. True. Sharp. And he has nothing to say back.`,
        choices: [
            {
                id: 'wait_response',
                text: 'Wait for his response.',
                nextSceneId: 'pivot_question'
            },
            {
                id: 'just_leave',
                text: 'Don\'t wait. Turn around and walk out.',
                nextSceneId: 'exit_door'
            }
        ],
        lessonId: 15, // Infrastructure gets blamed
        imageKey: ImageKeys.SYDNEY_FRUSTRATED,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    pivot_question: {
        sceneId: 'pivot_question',
        sceneText: `You take a breath. Shift the question.

"Okay. Different question. What would change for you if I just... left?"

Oswaldo squints. "What do you mean?"

"If I walked out right now. Tonight. What would you have to do different tomorrow?"

He opens his mouth. Closes it. You can see him actually trying to think about it—maybe for the first time.

"I mean... I'd figure it out."

"WHAT would you figure out? Specifically?"

The silence is louder than the yelling was.`,
        choices: [
            {
                id: 'press_point',
                text: 'Press the point. Make him list it.',
                nextSceneId: 'list_everything'
            },
            {
                id: 'let_silence',
                text: 'Let the silence sit. See if he gets there himself.',
                nextSceneId: 'silence_works'
            }
        ],
        lessonId: 17, // What am I to you?
        imageKey: ImageKeys.OSWALDO_AWAKE,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    what_would_you_do: {
        sceneId: 'what_would_you_do',
        sceneText: `"If I left right now," you say slowly, "what would you do?"

Oswaldo blinks, caught off guard. The question isn't angry. It's curious. Clinical.

"I mean... I'd figure it out."

"But WHAT? What specifically would you figure out? Walk me through it."

He shifts uncomfortably. "I'd... I mean, the room—"

"How would you pay for it?"

"I'd get money somehow."

"From where?"

The silence stretches. He doesn't have an answer. He's never had to have one.

Because you've always been there, making sure he didn't need one.`,
        choices: [
            {
                id: 'let_him_think',
                text: 'Let him sit with that realization.',
                nextSceneId: 'silence_works'
            },
            {
                id: 'give_up_now',
                text: 'He\'s never going to get it.',
                nextSceneId: 'give_up_loop'
            }
        ],
        lessonId: 5, // Output vs Presence
        imageKey: ImageKeys.OSWALDO_AWAKE,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    real_talk: {
        sceneId: 'real_talk',
        sceneText: `You find Oswaldo when he's actually awake. Coherent. Not defensive yet.

"I need to talk to you. For real. Not a fight."

Something in your voice makes him put the phone down. "Okay."

"I'm exhausted. Not normal tired. Soul tired. I carry everything here—the money, the planning, the thinking ahead—and nobody sees it. Not even you."

He's quiet. Listening, for once.

"I need you to tell me: do you understand what I do? Or am I just... furniture that pays bills?"

The question hangs there. Raw. Honest. Terrifying.`,
        choices: [
            {
                id: 'wait_answer',
                text: 'Wait for his answer.',
                nextSceneId: 'rare_hope'
            },
            {
                id: 'assume_worst',
                text: 'You already know the answer. Walk away.',
                nextSceneId: 'quiet_exit'
            }
        ],
        lessonId: 5, // Output vs Presence
        imageKey: ImageKeys.SYDNEY_THINKING,
        isEnding: false,
        endingType: null,
        mood: Moods.TENSE
    },

    speechless_exit: {
        sceneId: 'speechless_exit',
        sceneText: `You have no words left. They've all been used before, in conversations just like this one.

So you just... stop. Stop trying. Stop explaining. Stop carrying.

You pick up your bag. The one that's been half-packed for months. The one you never really unpacked.

Oswaldo watches you. For once, he doesn't have a quip. He just watches.

"Where are you going?"

You don't answer. Because you don't know. But you know you're going.`,
        choices: [
            {
                id: 'go_exit',
                text: 'Leave. Just leave.',
                nextSceneId: 'exit_door'
            }
        ],
        lessonId: 4, // Your energy keeps it alive
        imageKey: ImageKeys.THE_DOOR,
        isEnding: false,
        endingType: null,
        mood: Moods.NEUTRAL
    },

    work_defeated: {
        sceneId: 'work_defeated',
        sceneText: `You walk away. Again. Get to work. Again.

The laptop boots up. The routine kicks in. By afternoon, you've got what you need. Room paid. Crisis averted. Again.

Nobody noticed it was a crisis. Nobody notices it's handled.

This is your life. Invisible labor on repeat.

But today, the invisibility feels heavier. Not because anything changed—because you KNOW now, and knowing makes it worse.

You can't unsee the pattern. And you can't seem to break it.`,
        choices: [
            {
                id: 'accept_pattern',
                text: 'Accept the pattern. At least you see it.',
                nextSceneId: 'ending_loop'
            },
            {
                id: 'try_tomorrow',
                text: 'Tomorrow. Try something different tomorrow.',
                nextSceneId: 'set_boundary'
            }
        ],
        lessonId: 7, // This isn't hard
        imageKey: ImageKeys.SYDNEY_LAPTOP,
        isEnding: false,
        endingType: null,
        mood: Moods.DARK
    },

    one_more_try: {
        sceneId: 'one_more_try',
        sceneText: `You hesitate at the door. Your hand on the handle.

What if things could be different? What if one more conversation, one more try...

The hope is small. Bruised. But it's there.

Maybe the answer isn't running. Maybe it's one last, honest conversation.

Or maybe you're just scared to leave.

Hard to tell the difference sometimes.`,
        choices: [
            {
                id: 'try_talk',
                text: 'Put the bag down. Try talking one more time.',
                nextSceneId: 'real_talk'
            },
            {
                id: 'no_leave',
                text: 'No. You\'ve tried enough. Open the door.',
                nextSceneId: 'exit_door'
            }
        ],
        lessonId: 13, // Won't vs Can't
        imageKey: ImageKeys.THE_DOOR,
        isEnding: false,
        endingType: null,
        mood: Moods.NEUTRAL
    }
};

// Additional placeholder scenes for missing image keys
scenes.sydney_frustrated = scenes.confront_oswaldo; // Reuse
scenes.oswaldo_sleeping = scenes.wake_oswaldo; // Reuse

/**
 * Mock Story Service Class
 */
class MockStoryService {
    constructor() {
        this.scenes = scenes;
    }

    /**
     * Get the opening scene
     * @returns {Promise<import('../contracts.js').Scene>}
     */
    async getOpeningScene() {
        return { ...this.scenes.opening };
    }

    /**
     * Get the next scene based on choice
     * @param {string} currentSceneId 
     * @param {string} choiceId 
     * @param {import('../contracts.js').GameState} gameState 
     * @returns {Promise<import('../contracts.js').Scene>}
     */
    async getNextScene(currentSceneId, choiceId, _gameState) {
        const currentScene = this.scenes[currentSceneId];
        if (!currentScene) {
            console.error(`Scene not found: ${currentSceneId}`);
            return this.scenes.ending_loop;
        }

        const choice = currentScene.choices.find(c => c.id === choiceId);
        if (!choice) {
            console.error(`Choice not found: ${choiceId} in scene ${currentSceneId}`);
            return this.scenes.ending_loop;
        }

        const nextScene = this.scenes[choice.nextSceneId];
        if (!nextScene) {
            console.error(`Next scene not found: ${choice.nextSceneId}`);
            return this.scenes.ending_loop;
        }

        return { ...nextScene };
    }

    /**
     * Get a recovery scene for when Gemini fails mid-game and
     * the current scene ID is incompatible with mock service.
     * Returns a non-ending scene that keeps the game going.
     * @returns {Promise<import('../contracts.js').Scene>}
     */
    async getRecoveryScene() {
        return { ...this.scenes.sit_reflect };
    }

    /**
     * Get a scene by ID
     * @param {string} sceneId
     * @returns {import('../contracts.js').Scene|undefined}
     */
    getSceneById(sceneId) {
        return this.scenes[sceneId] ? { ...this.scenes[sceneId] } : undefined;
    }

    /**
     * Get all available scene IDs (for debugging)
     * @returns {string[]}
     */
    getAllSceneIds() {
        return Object.keys(this.scenes);
    }

    /**
     * Check if service is available (always true for mock)
     * @returns {boolean}
     */
    isAvailable() {
        return true;
    }
}

// Export singleton instance
export const mockStoryService = new MockStoryService();
export default mockStoryService;
