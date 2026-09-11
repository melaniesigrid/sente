# What protects main

`ruleset-main.json` is the branch ruleset for `main`, checked in so that the protection is
something you can read and review rather than something you have to click through four
settings pages to discover. It is not applied automatically; GitHub does not read it from the
repository. Apply it with:

    gh api --method POST repos/melaniesigrid/sente/rulesets --input .github/ruleset-main.json

and to see what is actually in force, which is the only answer that counts:

    gh api repos/melaniesigrid/sente/rulesets

If the ruleset already exists, `POST` will create a second one rather than replacing the first.
Update it in place with `--method PUT` and the id that the listing gives you.

## What it requires

A pull request, and the `check` job passing on it. Nothing else. Reviews are set to zero
approvals on purpose: several sessions work this tree at once and none of them can approve
their own work, so requiring an approval would stop everything rather than improve anything.
Force-pushing and deleting `main` are both refused.

## What it deliberately does not require

`strict_required_status_checks_policy` is off. That is the "branches must be up to date before
merging" rule, and it is the one that sounds like the answer and is not: `main` moves several
times an hour here, so turning it on would mean every open branch chasing a base that has
already moved again by the time it catches up. The merge queue is the version of that
guarantee that does not cost the chase (it tests the merge result just before it lands), and
it belongs here once it can be enabled. It is not in the JSON because the API refuses the rule:

    422 Validation Failed — Invalid rule 'merge_queue':

with no reason given. The Rules UI says more than the API does, so that is where to enable it:
Settings → Rules → Rulesets → the `main` ruleset → Require merge queue.

## What this does not protect against

Two things went wrong on 11 September 2026, and this ruleset addresses one of them.

It would have caught the first: a prose change landed on `main` without the legal stamp moving,
`main` went red, and every open branch inherited the failure. A required check on `main` stops
a red commit from landing at all.

It would not have caught the second. Four PRs were stacked, each based on the one below, and
they merged into their own bases after the bottom of the stack had already reached `main`,
so all four were marked merged and none of their content was on `main`. Every one of them was
green and genuinely mergeable into the base it named. The mistake was which base it named, and
no status check can see that. Land a stack bottom-up in one sitting, or retarget the rest of it
at `main` the moment the bottom merges.
