/**
 * No Vacancies - Lessons
 *
 * All 17 lessons about invisible labor and load-bearing in relationships.
 * These appear as popups when scenes demonstrate them.
 */

export interface Lesson {
	id: number;
	title: string;
	quote: string;
	insight: string;
	emotionalStakes: string[];
	storyTriggers: string[];
	unconventionalAngle: string;
}

export const lessons: Lesson[] = [
    {
        id: 1,
        title: 'Load-Bearing Beams Get Leaned On',
        quote: "Load-bearing beams don't get applause. They get leaned on.",
        insight: "When you're the structural support, you don't get applause. You get weight.",
        emotionalStakes: [
            'The exhaustion of being essential but unacknowledged',
            "The loneliness of being 'the strong one'",
            'The resentment that builds silently'
        ],
        storyTriggers: [
            'Sydney pays the room. Nobody thanks her.',
            "She's been awake for 4 hours solving problems before anyone wakes up",
            "Someone says 'it's not like it's hard for you'"
        ],
        unconventionalAngle:
            "The competent person's curse - the better you are, the less credit you get"
    },
    {
        id: 2,
        title: "They Don't Understand the Concept",
        quote: "I don't mind not getting applause, but what I do mind is them not understanding the load-bearing concept.",
        insight:
            "It's not the lack of applause that hurts. It's that they genuinely don't see the load.",
        emotionalStakes: [
            'The work that disappears into the result, noticed only when absent',
            "The gap between what you know you're doing and what they perceive",
            'Being gaslit by incomprehension'
        ],
        storyTriggers: [
            "Oswaldo says 'what did you do today?' at 2pm",
            "Someone suggests Sydney 'has it easy'",
            'The room is magically paid and nobody asks how'
        ],
        unconventionalAngle: "They're not evil, they're just blind. Which might be worse."
    },
    {
        id: 3,
        title: 'Resentment Toward the Load-Bearer',
        quote: 'People often get resentful, even if and especially if you are load-bearing and looking out for them.',
        insight:
            'People often get resentful of the person carrying them, especially when competence makes them feel inadequate.',
        emotionalStakes: [
            'The betrayal of being punished for helping',
            "Confusion: 'I'm doing everything right, why do they hate me?'",
            'The trap of being needed but resented'
        ],
        storyTriggers: [
            'Oswaldo gets cold after Sydney succeeds',
            "They call her 'controlling' for having standards",
            'Subtle eye rolls when she makes decisions'
        ],
        unconventionalAngle: "Your competence is an accusation they didn't ask for"
    },
    {
        id: 4,
        title: 'Your Energy Keeps It Alive',
        quote: 'Your attention, energy, explanation, and patience are the thing keeping the dynamic alive. If you stopped supplying them, the thing would wither or die.',
        insight:
            'Your attention, energy, explanation, and patience ARE the dynamic. Without you supplying them, it dies.',
        emotionalStakes: [
            "You are the engine. The machine does not know the difference between you and the fuel.",
            "The terrifying question: 'What happens if I stop?'",
            'The exhaustion of being the only source'
        ],
        storyTriggers: [
            "Sydney wonders what would happen if she just... didn't",
            'She stops reminding Oswaldo of something. He forgets.',
            'The room gets messy because she stopped cleaning'
        ],
        unconventionalAngle:
            "The relationship isn't dysfunctional - it's functioning exactly as designed, with you as the fuel"
    },
    {
        id: 5,
        title: 'Output vs Presence',
        quote: 'Be valued for output vs. be valued for presence.',
        insight: 'Are you valued because of what you produce, or because you exist?',
        emotionalStakes: [
            'The fear of being replaceable if you stop producing',
            'The gap between missing a person and missing a utility service',
            'The exhaustion of earning your place daily'
        ],
        storyTriggers: [
            "Oswaldo says 'I love you' right after Sydney gives him money",
            "She's sick and the first question is about the room payment",
            "She imagines: 'If I stopped doing everything, would they want me here?'"
        ],
        unconventionalAngle:
            'Some people are furniture. Some people are appliances. Know which one you are.'
    },
    {
        id: 6,
        title: 'Invisibility of Competence',
        quote: 'The better you do your job, the less visible it is. Stability erases evidence of effort. Prevention never feels dramatic.',
        insight:
            'The better you do your job, the less visible it is. Stability erases evidence of effort.',
        emotionalStakes: [
            'The paradox of excellence = invisibility',
            'Craving crisis just so someone will notice',
            'The thankless nature of maintenance'
        ],
        storyTriggers: [
            'Room paid before anyone knew it was due',
            'Problems solved before they become visible',
            "Trina: 'Must be nice to never have to worry'"
        ],
        unconventionalAngle: 'The only way to be seen is to let things break'
    },
    {
        id: 7,
        title: "This Isn't Hard",
        quote: "People unconsciously conclude: 'This isn't hard. If it were hard, I'd feel it. If it required effort, I'd see strain.'",
        insight: "If they don't see strain, they assume there isn't any.",
        emotionalStakes: [
            'Being dismissed as naturally lucky',
            "Your skills being erased as 'just how you are'",
            'The isolation of unrecognized struggle'
        ],
        storyTriggers: [
            "'You just sit on your laptop'",
            "'I could do that if I had a computer'",
            'Oswaldo tried once. Got flagged in 2 hours. Blamed the method.'
        ],
        unconventionalAngle: 'Your poker face is your prison'
    },
    {
        id: 8,
        title: "Asking for Help Doesn't Work",
        quote: "When I ask for help, often people don't take me seriously because they think I can't actually be needing help.",
        insight: "When you rarely need help, people don't take you seriously when you finally ask.",
        emotionalStakes: [
            'The despair of finally reaching out and being dismissed',
            "'You'll figure it out' as dismissal",
            'Trained helplessness on the receiving end'
        ],
        storyTriggers: [
            "Sydney says 'I'm really struggling'",
            "Oswaldo: 'You always say that and it works out'",
            'She stops asking because it makes things worse'
        ],
        unconventionalAngle: 'Your track record of solving things is now your cage'
    },
    {
        id: 9,
        title: 'Discomfort Becomes Attacks',
        quote: 'That discomfort often flips into: irritation, distancing, subtle rebellion, minimizing your role.',
        insight:
            'When your competence makes others uncomfortable, it flips into irritation and rebellion.',
        emotionalStakes: [
            'Being punished for being good at things',
            "The confusion of 'I'm helping, why are they mad?'",
            'Slow realization that your success threatens them'
        ],
        storyTriggers: [
            'Oswaldo gets snippy after she lands a score',
            "'Why do you always keep score?'",
            'They find small things to criticize'
        ],
        unconventionalAngle: 'Your light is making their darkness visible, and they hate you for it'
    },
    {
        id: 10,
        title: 'What You Actually Want to Hear',
        quote: "You want someone to say: 'I see what would break if you weren't here.'",
        insight: "'I see what would break if you weren't here.'",
        emotionalStakes: [
            'The desperate hunger for acknowledgment',
            'Wanting to be SEEN, not just used',
            'The rare ending Sydney craves'
        ],
        storyTriggers: [
            'Oswaldo actually says this (rare ending)',
            'Sydney imagines someone saying it',
            'She realizes no one ever has'
        ],
        unconventionalAngle: "You don't want thanks. You want witnesses."
    },
    {
        id: 11,
        title: 'See It AND Act Accordingly',
        quote: "It's more than that. I think we want people to see that and act accordingly. Like... if you know I'm breaking my back to make this money, don't loan your buddy $50 so he can buy drugs the day before rent is due.",
        insight: "Words about what they see do not change who does the work.",
        emotionalStakes: [
            'The gap between words and actions',
            'Recognition without change is just manipulation',
            'Empty apologies followed by same behavior'
        ],
        storyTriggers: [
            'Oswaldo says he appreciates her, then does something selfish',
            "Dex knows she's struggling, asks for money anyway",
            'Empty apologies followed by same behavior'
        ],
        unconventionalAngle: 'Understanding without action is just sophisticated dismissal'
    },
    {
        id: 12,
        title: 'Making Effort Legible',
        quote: 'The only durable fix is making some effort legible. That means: letting minor failures happen, allowing some friction to be felt, not preemptively smoothing everything. Not to punish. Not to teach lessons. But to reintroduce reality.',
        insight:
            'The only fix is letting failures happen. Not to punish, but to reintroduce reality.',
        emotionalStakes: [
            'The terror of letting go',
            "The guilt of 'letting them fail'",
            'The freedom of not smoothing everything'
        ],
        storyTriggers: [
            "Sydney doesn't pay the room in time (intentionally or not)",
            'She stops reminding, things fall apart',
            'Reality arrives: management knocks'
        ],
        unconventionalAngle: "You're not causing problems. You're revealing them."
    },
    {
        id: 13,
        title: "Won't vs Can't",
        quote: "You are very good at turning 'won't' into 'can't' in your head. You do this by: imagining hidden stressors, over-crediting intent, downplaying repeated behavior.",
        insight:
            "You turn 'won't' into 'can't' by imagining hidden stressors and over-crediting intent.",
        emotionalStakes: [
            'The self-gaslighting of the compassionate',
            "Making excuses for people who aren't making any for themselves",
            'The trap of empathy'
        ],
        storyTriggers: [
            "Oswaldo 'can't' help because he's depressed. But he's up all night when there's a party.",
            'Sydney catches herself making excuses',
            'Pattern recognition vs. benefit of the doubt'
        ],
        unconventionalAngle: 'Your understanding of their trauma is being weaponized against you'
    },
    {
        id: 14,
        title: 'The System Only Responds to Load Distribution',
        quote: "The system doesn't care about explanations. It only responds to load distribution.",
        insight: "Load distribution is the only language the system speaks. Everything else is noise.",
        emotionalStakes: [
            'The futility of communication',
            'Words as currency that inflates and loses value each time they aren\'t backed by action',
            'The clarity of just looking at who does what'
        ],
        storyTriggers: [
            'Sydney explains why she needs help. Nothing changes.',
            'She stops explaining, starts observing',
            'Actions speak; words are noise'
        ],
        unconventionalAngle: 'The system is already telling you everything you need to know'
    },
    {
        id: 15,
        title: 'Infrastructure Gets Blamed',
        quote: "When infrastructure works, it's invisible. When it fails, everyone notices.",
        insight:
            "Blamed when one thing breaks. Invisible when ninety-nine things hold.",
        emotionalStakes: [
            'The unfairness of being blamed for the one thing that broke',
            "No credit for the 100 things that didn't break",
            'The thankless nature of maintenance work'
        ],
        storyTriggers: [
            'Something goes wrong and Sydney gets blamed',
            "'Why didn't you...' when she does everything",
            'The one time something slips, everyone notices'
        ],
        unconventionalAngle:
            'Heroes save the day. Infrastructure prevents it from needing saving. Guess who gets the movie.'
    },
    {
        id: 16,
        title: 'Relationships Are About Risk Reduction',
        quote: "Relationships aren't about whether something costs you money, they're about whether it reduces someone else's risk.",
        insight:
            "Relationships aren't about what it costs you—they're about whether your presence reduces their risk.",
        emotionalStakes: [
            'The revelation of what partnership means',
            "'Am I reducing his risk? Is he reducing mine?'",
            'The clarity of the imbalance'
        ],
        storyTriggers: [
            "Oswaldo thinks her paying for the room 'doesn't count' because she'd pay anyway",
            "Sydney realizes she's reducing everyone's risk but her own",
            "The question: 'What would change for him if I left?'"
        ],
        unconventionalAngle:
            "If your presence doesn't change their behavior, you're not a partner. You're a subsidy."
    },
    {
        id: 17,
        title: 'What Am I to You?',
        quote: "If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?",
        insight:
            "If my presence doesn't change how you act, plan, or sacrifice, then what am I to you?",
        emotionalStakes: [
            'The devastating clarity of this question',
            'The trap of the question you already know the answer to',
            'The beginning of real change or real leaving'
        ],
        storyTriggers: [
            'Sydney asks herself this directly',
            "She watches Oswaldo's behavior for evidence",
            "She can't unsee it now"
        ],
        unconventionalAngle: "The question you're afraid to ask because you already know the answer"
    }

    {
        id: 18,
        title: 'The Emotional Accountant',
        quote: "You track every favor, every loan, every 'you'll pay me back.' They don't know there's a ledger.",
        insight: "The ledger exists. Only one of you is keeping it.",
        emotionalStakes: [
            'The weight of tracking what no one else bothers to track',
            'The exhaustion of being the only one who remembers',
            'The moment you stop keeping score and everything tips over'
        ],
        storyTriggers: [
            "Sydney runs the numbers in her head: $40 owed, $65 due, $12 in the account",
            "Trina says 'you know I'm good for it' for the fourth time this week",
            "Sydney stops counting and the math gets worse"
        ],
        unconventionalAngle: "Your memory is not a virtue. It's a burden you chose to carry for people who chose not to."
    },
    {
        id: 19,
        title: 'The Cover Story',
        quote: "When you make someone sound better than they are, you're not protecting them. You're doing unpaid PR.",
        insight: "Every excuse you make for them is a sentence you wrote for their reputation and signed with your credibility.",
        emotionalStakes: [
            'The slow erosion of your own credibility through borrowed goodwill',
            'The moment you realize you believe your own cover story',
            'The cost of defending someone who would not defend you'
        ],
        storyTriggers: [
            "Sydney explains to the front desk why Oswaldo missed rent drop-off",
            "She catches herself making his excuses to Trina before he can",
            "Dex asks why she covers for him and she doesn't have an answer"
        ],
        unconventionalAngle: "You are not protecting him. You are protecting the version of him you need to believe in."
    },
    {
        id: 20,
        title: 'Competence as Silence',
        quote: "You got so good at handling it that you erased the evidence. Now there's no crisis. Which means, to them, there's no problem.",
        insight: "Prevention looks like nothing happened. Which means you did nothing. Which means there was nothing to do.",
        emotionalStakes: [
            'The paradox of skill making effort invisible',
            'The anger of being dismissed precisely because you succeeded',
            'No one saves you because no one sees you drowning'
        ],
        storyTriggers: [
            "Sydney solves a problem before anyone else woke up",
            "Oswaldo says 'see, it worked out' — because she made it work out",
            "She lets one thing fail just to see if anyone notices"
        ],
        unconventionalAngle: "The only way to make the problem visible is to stop being the solution."
    },
    {
        id: 21,
        title: 'The Pity Trap',
        quote: "When you're the one who has it together, any moment you show need gets read as either performance or failure.",
        insight: "Pity and contempt live next door. Ask for help once and you either don't mean it or you've collapsed.",
        emotionalStakes: [
            'The isolation of competence — no one believes you need help',
            'The double bind: either you are fine or you have failed',
            'The loneliness of asking and being disbelieved'
        ],
        storyTriggers: [
            "Sydney says she's not okay and nobody adjusts their plans",
            "Oswaldo: 'You always land on your feet, I'm not worried about you'",
            "She stops saying she needs help because it doesn't change anything"
        ],
        unconventionalAngle: "Your resilience is the cage. The better you are at surviving, the less anyone believes you need rescue."
    },
    {
        id: 22,
        title: 'The Witness Problem',
        quote: "You need someone to see the work. But explaining the work is more work. And the explaining gets mistaken for complaining.",
        insight: "The request for acknowledgment gets heard as a demand. The demand gets heard as ingratitude.",
        emotionalStakes: [
            'The exhaustion of narrating your own labor to people who benefit from it',
            'Being labeled difficult for describing what is actually difficult',
            'The silence you choose when talking makes it worse'
        ],
        storyTriggers: [
            "Sydney starts to explain why she's tired and Oswaldo sighs",
            "Trina: 'You always make such a big deal'",
            "Sydney goes quiet because explaining costs more than absorbing"
        ],
        unconventionalAngle: "The work is invisible because making it visible costs you. So you keep it invisible. So it stays invisible."
    },
    {
        id: 23,
        title: 'The Energy Ledger',
        quote: "You can give time without attention. You can give attention without care. They have been withdrawing from all three columns.",
        insight: "Time, attention, and care are not the same resource. They have been spending all three and replenishing none.",
        emotionalStakes: [
            'The depletion that happens below the level of any single ask',
            'The slow drain of being present for people who are absent for you',
            'The moment you notice you are empty and cannot point to where it went'
        ],
        storyTriggers: [
            "Sydney is physically in the room but already somewhere else",
            "She realizes she has not had a full night of her own thoughts in weeks",
            "Oswaldo asks what she's thinking and she says 'nothing'"
        ],
        unconventionalAngle: "You didn't lose it all at once. You gave it away in increments small enough that each one seemed fine."
    },
    {
        id: 24,
        title: 'Strategic Incompetence',
        quote: "The fastest way to stop being asked to do something is to do it badly the first time. They learned this. You never did.",
        insight: "Your high standards are the reason you got the job and the reason you can't quit it.",
        emotionalStakes: [
            'The trap of your own competence — too good to be allowed to stop',
            'The resentment of watching others opt out through failure',
            'The exhaustion of the person who cannot do things badly'
        ],
        storyTriggers: [
            "Oswaldo tried once and blamed the tools",
            "Sydney watches him get out of things by being unreliable",
            "She considers doing the task badly on purpose, then can't"
        ],
        unconventionalAngle: "You are not more responsible. You are less able to tolerate the consequences of being bad at things."
    },
    {
        id: 25,
        title: 'The Debt Amnesia',
        quote: "There is a specific type of person who remembers every favor they gave and forgets every favor they got. You are the other type.",
        insight: "Your generosity is real. So is their amnesia. Neither fact cancels the other.",
        emotionalStakes: [
            'The anger of giving and watching it disappear without acknowledgment',
            'The self-doubt of wondering if you imagined the giving',
            'The clarity of seeing the asymmetry plainly and still not knowing what to do with it'
        ],
        storyTriggers: [
            "Trina asks for something Sydney already gave her once before",
            "Dex mentions a favor Sydney did for him like it was a coincidence",
            "Sydney stops saying 'remember when I...' because no one does"
        ],
        unconventionalAngle: "Their amnesia is not a medical condition. It's a policy."
    },
    {
        id: 26,
        title: "The Room's Economy",
        quote: "You are not in a relationship. You are in a household. A household has suppliers and consumers.",
        insight: "The exchange rate in this room has never been equal. The question is whether you've named that or just absorbed it.",
        emotionalStakes: [
            'The clarity of seeing the transaction for what it is',
            'The discomfort of naming something that everyone pretends is love',
            'The specific loneliness of being the only one who knows the actual numbers'
        ],
        storyTriggers: [
            "Sydney calculates: $65 rent, $40 food, $20 phone bills, $0 from anyone else",
            "Oswaldo says 'what's mine is yours' — she has never seen his money",
            "She does the math out loud just once and the room goes quiet"
        ],
        unconventionalAngle: "Call it what it is. Not because naming it changes it. Because you deserve to know what you are carrying."
    },
    {
        id: 27,
        title: 'The Loyalty Tariff',
        quote: "Staying proves you're loyal. Leaving proves you were always going to leave. They've built a logic where you can't win.",
        insight: "The system is designed so that any choice you make confirms what they already believe about you.",
        emotionalStakes: [
            'The trap of a frame where staying costs and leaving costs more',
            'The exhaustion of being legible only as loyalty or betrayal',
            'The moment you see the trap and are still inside it'
        ],
        storyTriggers: [
            "Sydney thinks about leaving and immediately imagines Oswaldo's version of why",
            "Trina: 'She's always threatening to leave but she never does'",
            "Sydney realizes that the story they will tell about her is already written"
        ],
        unconventionalAngle: "You are not choosing between leaving and staying. You are choosing which story they get to tell about you."
    }
];

/**
 * Get a lesson by ID
 * @param {number} id
 * @returns {import('./contracts.js').Lesson|undefined}
 */
export function getLessonById(id: number): Lesson | undefined {
    return lessons.find((l) => l.id === id);
}

/**
 * Get a random trigger from a lesson
 * @param {number} lessonId
 * @returns {string|null}
 */
export function getRandomTrigger(lessonId: number): string | null {
    const lesson = getLessonById(lessonId);
    if (!lesson || !lesson.storyTriggers.length) return null;
    return lesson.storyTriggers[Math.floor(Math.random() * lesson.storyTriggers.length)];
}

/**
 * Check if a lesson matches a scene based on keywords
 * @param {string} sceneText
 * @returns {number|null} Lesson ID or null
 */
export function detectLessonInScene(sceneText: string): number | null {
    const text = sceneText.toLowerCase();

    // Check for specific keywords/phrases that indicate lessons
    if (text.includes('keep score') || text.includes('keeping score')) return 9;
    if (text.includes('what did you do today')) return 2;
    if (text.includes('energy around here')) return 4;
    if (text.includes('i see what would break')) return 10;
    if (text.includes("you'll figure it out") || text.includes('you always figure')) return 8;
    if (text.includes("this isn't hard") || text.includes('not that hard')) return 7;
    if (text.includes('controlling')) return 3;
    if (text.includes('borrow') && text.includes('money')) return 11;
    if (text.includes('what am i to you')) return 17;
    if (text.includes('risk') && text.includes('reduce')) return 16;
    if (text.includes("won't") && text.includes("can't")) return 13;
    if (text.includes('let it fail') || text.includes('let things break')) return 12;

    // Lessons 18-27
    if (text.includes("there's a ledger") || text.includes('keeping score') && text.includes('money')) return 18;
    if (text.includes('cover story') || text.includes('making excuses for him')) return 19;
    if (text.includes('no crisis') || text.includes('see it worked out')) return 20;
    if (text.includes("always land on your feet") || text.includes("you'll figure it out") && text.includes("always")) return 21;
    if (text.includes('making it worse') && text.includes('explain') || text.includes('big deal') && text.includes('complaining')) return 22;
    if (text.includes('already somewhere else') || text.includes('what are you thinking') && text.includes("nothing")) return 23;
    if (text.includes('did it badly') || text.includes('strategic') && text.includes("competence")) return 24;
    if (text.includes("remember when") && (text.includes("trina") || text.includes("dex")) || text.includes("debt amnesia")) return 25;
    if (text.includes("what's mine is yours") || text.includes("supplier") && text.includes("consumer")) return 26;
    if (text.includes('always going to leave') || text.includes("loyalty tariff") || text.includes("story they will tell")) return 27;

    return null;
}
