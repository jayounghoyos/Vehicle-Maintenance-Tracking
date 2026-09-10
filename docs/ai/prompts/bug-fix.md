# Prompt: fixing a bug

The point of this one is the verifiable criterion. "It's broken, fix it" gives you a large diff and no way to tell whether it worked. Fill the bracketed parts and delete this line.

---

Symptom: [WHAT I SEE, not what I think causes it].

Where: [FILE OR SCREEN].

Expected instead: [THE VERIFIABLE CRITERION — what would be true if this were fixed].

Before changing anything, tell me what you think the cause is and how you would fix it. I want to choose the approach before there is a diff.

Scope: only [FILE(S)]. If the same bug looks like it exists elsewhere, say so and leave it — do not fix it in this branch. If you find something unrelated that seems wrong, tell me instead of correcting it.

A regression test is [REQUIRED / NOT NEEDED BECAUSE …]. If the existing tests did not catch this, say why — a mock that accepted both the right and the wrong call is itself the bug.

Work: branch `fix/[NAME]`, one commit, `fix(...)` with scope, no `Co-Authored-By`, `pnpm check` before you finish.
