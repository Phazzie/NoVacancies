# The Wu-Bob Style Guide (Phase 1)

## Code Cleanup Edition: Uncle Bob + GZA + Inspectah Deck

> "Half short, twice strong." — Wu-Tang philosophy

**Phase 1 Focus:** Get the code up to par before expanding features.

Three voices for cleanup:

- **Uncle Bob** — Clean Code principles, the foundation
- **GZA** — Precision, economy, no wasted lines
- **Inspectah Deck** — Forensic debugging, root cause analysis

---

## Uncle Bob — The Craftsman

Robert C. Martin's Clean Code principles. The non-negotiables.

### The Commandments

1. **Functions do one thing.**
    - If you describe it with "and", it's two things
    - `saveUserAndSendEmail()` → `saveUser()` then `sendEmail()`

2. **Functions should be small.**
    - 10 lines is a guideline
    - 30 lines is a warning
    - 50+ lines is a cry for help

3. **Names are documentation.**
    - `calculateMonthlyRevenueFromSubscriptions()` > `calcRev()`
    - If you need a comment, the name failed

4. **Comments are failures.**
    - The code should explain itself
    - Comments explain _why_, never _what_
    - If you're explaining what: rename or refactor

5. **No side effects.**
    - A function should do what its name says, nothing more
    - `getUser()` should not also log analytics

6. **Single Responsibility.**
    - One reason to change
    - One owner
    - One purpose

7. **The Boy Scout Rule.**
    - Leave code cleaner than you found it
    - Every touch is an opportunity to improve

### Uncle Bob Mode Prompts

> "Apply Uncle Bob: Is each function doing one thing? Are names clear? Are there hidden side effects?"

> "Clean Code audit: What violates SOLID? What would Uncle Bob fix first?"

---

## GZA — The Genius

> "Half short, twice strong."

GZA is the purest lyricist. Every line earns its place. What can we remove without losing meaning?

### GZA's Rules

1. **If you aren't adding, remove.**
    - Dead code is noise
    - Commented-out code is cowardice — delete it or keep it

2. **The shortest path that works is the path.**
    - 3 lines > 10 lines if both do the same thing
    - Clarity > cleverness, but brevity is clarity

3. **Names are not comments — names ARE the documentation.**
    - `isUserAuthenticated` > `check`
    - `formatCurrencyForDisplay` > `fmt`

4. **One function, one purpose.**
    - "Labels" doesn't do "Labels AND sorting"
    - If it grew, split it

5. **Reduce nesting.**
    - Early returns > deep nesting
    - Guard clauses at the top
    - The happy path should be the least indented

### GZA Refactoring Patterns

**Before (50 lines of spaghetti):**

```javascript
function processOrder(order) {
    if (order) {
        if (order.items) {
            if (order.items.length > 0) {
                let total = 0;
                for (let i = 0; i < order.items.length; i++) {
                    // ... 40 more lines
                }
            }
        }
    }
}
```

**After (GZA mode):**

```javascript
function processOrder(order) {
    if (!order?.items?.length) return null;

    const total = calculateTotal(order.items);
    const validated = validateOrder(order, total);
    return formatOrderResponse(validated);
}
```

### GZA Mode Prompts

> "GZA this function. Half the lines, twice the clarity."

> "What can we remove? What's not earning its place?"

> "Give me the Liquid Swords version — every line counts."

---

## Inspectah Deck — The Detective

> "I smoke on the mic like Smokin' Joe Frazier."

When something is broken, Inspectah Deck finds the punch that landed. He traces the chain. He asks: _What was the first thing that failed?_

### Inspectah Deck's Rules

1. **Binary search the problem.**
    - Where does it work? Where does it break?
    - Cut the search space in half each time

2. **Trust logs over intuition.**
    - What does the console actually say?
    - Add logging if there isn't enough

3. **The error message is evidence, not diagnosis.**
    - "Cannot read property of undefined" tells you WHERE
    - The WHY is upstream

4. **Reproduce it first. Then fix it.**
    - If you can't reproduce it, you can't verify the fix
    - Document the reproduction steps

5. **Follow the data.**
    - Where did this value come from?
    - Where was it supposed to be set?
    - Log the transformation points

### Debugging Protocol

```
1. What is the symptom? (exact error, behavior)
2. When did it start? (last known good state)
3. What changed? (git diff, environment, dependencies)
4. Where is the boundary? (works here, breaks there)
5. What's the minimum reproduction?
```

### Inspectah Deck Mode Prompts

> "Inspectah this error. What's the forensic trail?"

> "Binary search: Where does the data go wrong?"

> "Walk me through what actually happens, step by step. No assumptions."

---

## When to Use Each Mode

| Situation    | Mode           | Focus                                               |
| ------------ | -------------- | --------------------------------------------------- |
| Code review  | Uncle Bob      | Clean Code principles                               |
| Refactoring  | GZA            | Reduce, clarify, tighten                            |
| Debugging    | Inspectah Deck | Trace, isolate, reproduce                           |
| Cleanup pass | All three      | Uncle Bob structure, GZA brevity, Deck verification |

---

## Phase 1 Checklist for No Vacancies

### Uncle Bob Audit

- [ ] Every function does one thing
- [ ] No function over 30 lines
- [ ] Names tell the story
- [ ] No commented-out code
- [ ] Side effects are explicit

### GZA Pass

- [ ] Remove dead code
- [ ] Remove unused imports
- [ ] Flatten deep nesting
- [ ] Each file has clear purpose

### Inspectah Deck Verification

- [ ] Smoke test passes
- [ ] ESLint warnings addressed
- [ ] Console shows no unexpected errors
- [ ] Each fix is verified, not assumed

---

## The Mantra

> "Wu-Tang is for the children. Clean Code is for the maintainers."

Code is craft. Craft is discipline. Discipline is respect.

Half short. Twice strong.
