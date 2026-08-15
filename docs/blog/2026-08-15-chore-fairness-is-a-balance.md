# Everyone thinks they do more than half

*2026-08-15*

Ross and Sicoly asked married couples, separately, what proportion of the
housework each of them did. Then they added the two answers together. The
totals came out well over 100%.

Nobody was lying. Your own contributions are simply more *available* to your
memory than anyone else's — you remember scrubbing the shower because you
were there, with wet knees; you did not witness your flatmate doing it on
Tuesday while you were out. Both people report honestly from the evidence
they have, and both are wrong in the same direction.

That single finding reframes most chore conflict from a dispute about
character into a dispute about **information** — and it is the reason the
chore page shipped today looks the way it does.

## What was there before

A bar chart of completed tasks per resident, all time, scaled to the highest
number.

| Problem | What it actually did |
|---|---|
| Counted **rows**, not time | A 2-minute bin run scored the same as a 25-minute shower scrub |
| Scaled to the **maximum** | Always paints someone's bar full — a podium, manufactured from nothing |
| **All-time** totals | Long residents coast on last year's credit; a newcomer looks permanently delinquent |

The middle one is the dangerous one. A public ranking is a punishment
mechanic whether or not you call it one, and Herrmann, Thöni and Gächter
(*Science*, 2008) found substantial **antisocial punishment** across many
societies — people punishing the *high* contributors, not the low ones.
Where it was common, the ability to punish destroyed cooperation instead of
sustaining it. In a product that places people from many countries into one
flat, that is close to a disqualifying result for a leaderboard.

## What shipped

**A balance, not a ranking.** Total the minutes, split evenly, and show each
person their signed distance from their own share — a diverging bar with the
centre line at *exactly your share*, scaled to the largest **imbalance**
rather than the largest contribution. A near-even month now reads as
near-even. Balances sum to exactly zero, and a test pins that: a fairness
number that does not close is not a fairness number.

Weighting is logged duration → the task's estimate → a deliberately small
default, so an unestimated chore can never outweigh a measured one. Minutes
are also the unit Swiss federal statistics use to value unpaid household
work, which makes it a number an institution can read without translation.

One deliberate asymmetry with the money ledger it borrows from: an expense
balance is settled by a transfer, but **a chore balance can only be settled
by doing the next thing**. So there is no `simplifyDebts` counterpart, on
purpose, and the UI says so — *ein Saldo wird nicht zurückgezahlt, sondern
mit der nächsten Aufgabe ausgeglichen.*

**A definition of done made of actions, not outcomes.** The most common
shape of a chore dispute is not "you didn't do it" — it is *"that's not
clean"*. That argument is unwinnable, because "clean" is a gradient and two
people with different standards can both be honestly right. So a checklist
item is a binary, observable action:

```
☐ Boden gewischt
☐ Abfalleimer geleert
☐ Spiegel gewischt
```

Never *"Bad ist sauber"*. Flatmates never have to agree what *sauber* means,
only whether the floor got wiped. Partial ticks are allowed and stay visibly
partial in the history — forcing all-or-nothing pushes people to either
overclaim or log nothing, and both corrupt the record. Where a task has no
agreed checklist, the page says so out loud rather than hiding the section;
in most real disputes, *"we never agreed what counts"* is the actual finding.

**A rota that is a default, not a lock.** Whose turn it is, is derived from
the rotation order and the completion count — never stored, so it cannot
drift from the log. Completing a task advances the rota *regardless of who
did it*, because covering for a flatmate must not cost you your own place in
the queue. Anyone may do anything at any time.

The honest case for a rota is not allocation — an honour system allocates
work fine. It is that the rota **removes the need to ask**, and the asking is
the expensive part: that is the moment a household conversation becomes a
household conflict, and eventually a staff mediation hour.

## What we deliberately did not build

No score, no quota, no streak, no karma, no rank, no badge, no
peer-punishment mechanic.

A monthly minutes target was the first thing designed and the first thing
cut. Extrinsic rewards can crowd out the norm they were meant to support
(Frey & Jegen, motivation crowding): a quota converts a shared obligation
into an individual one that people then *discharge* — exactly N minutes,
nothing off-list. Worse, it introduces the possibility of **failing**, and
the residents who would fail it most often are the ones having the hardest
month. An automatic system that names them delinquent is not a fairness
feature.

The shipped version can tell you that you are 40 minutes behind. It cannot
tell you that you have failed, and there is nothing for it to escalate to.

Equal time is also not the same as *fair*. Fair division defines fairness
over each person's own disutility, and twenty minutes of bathroom is not the
same cost to two people. We do not elicit that — it is expensive to ask and
trivial to game — so swapping a turn stays a first-class action rather than
a violation. Voluntary trade is the cheap decentralised approximation.

## The sentence above the numbers

The heaviest-lifting element on the screen is not a number. It is one line
explaining that almost everyone overestimates their own share, because we
remember our own work better than other people's.

Without it, a negative balance reads as an accusation, and people argue with
accusations. With it, the same number arrives as a **correction that applies
to everyone in the room** — including whoever is currently feeling smug about
being in the green.

## What would count as evidence

None of the research above was conducted on this population, in this
housing, with this software. It shaped our priors about what could go wrong,
which is a different thing from evidence that the design works.

What would count is already being tracked, and already has a baseline:
incidents per month, relocations caused by incompatibility, and staff hours
spent on mediation. If this is doing anything, those move. If they do not,
this is decoration and should be called decoration.

Related: [An operating system for living together](2026-08-14-cohabitation-os.md) ·
[The Hausordnung is now data](2026-08-14-hausordnung-is-data.md)
