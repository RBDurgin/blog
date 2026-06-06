---
title: "Which Claude Model Should You Actually Use? A Practitioner's Guide to Opus, Sonnet, and Haiku"
description: "A walk-through of the current Claude 4.x lineup — Opus 4.8, Sonnet 4.6, and Haiku 4.5 — what each is good at, where each falls down, and how to pick without defaulting to the most expensive one."
date: 2026-06-05
tags: ["claude", "claude-code", "ai-workflows", "model-selection"]
draft: false
---

Three models, one API. Most people I talk to about Claude just pick the biggest one and move on. That's a defensible default — and an expensive habit. The model you reach for shapes your latency budget, your bill, and — this is the part that surprises people — the quality of your output. The biggest model isn't always the best fit for the task.

Here's what's in the lineup right now, what each model is good for, where each falls down, and the rough heuristic I use to pick.

## The current lineup

As of June 2026 there are three Claude 4.x models you'll see most often ([Anthropic models overview](https://platform.claude.com/docs/en/about-claude/models/overview)):

| Model | API ID | Price (input / output, per Mtok) | Positioning |
|---|---|---|---|
| Claude Opus 4.8 | `claude-opus-4-8` | $5 / $25 | Deepest reasoning, longest agentic loops |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | $3 / $15 | The default workhorse |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | $1 / $5 | Fast, cheap, surprisingly capable |

Pricing per [Anthropic's pricing page](https://platform.claude.com/docs/en/about-claude/pricing) at time of writing.

They share the same API surface — tool use, prompt caching, vision, extended thinking, the same SDK. The differences are reasoning depth, latency, and price. You're not learning three different products.

And the gaps between tiers have shrunk with each release. In my experience, Haiku 4.5 will do things that needed Sonnet a year ago, and Sonnet 4.6 will do things that needed Opus a year ago. "Which model should I use" is worth re-asking every time a new version ships.

## Opus 4.8 — when depth is the constraint

Opus is the model I reach for when the *thinking* is the hard part, not the typing.

**Where it earns its cost:**

- **Hard debugging.** A flaky integration test in a 40k-line repo, where the cause could be a race condition, a misconfigured fixture, or a library upgrade three weeks ago. Opus will hold all of that in its head and trace it.
- **Architectural planning.** "Here's the current shape of the service, here's where we want to be in six months — what's the migration path?" Opus is the model that will actually push back on your assumptions rather than enthusiastically agreeing.
- **Long agentic loops.** Anything with 20+ tool calls where the agent has to remember why it made a decision twelve steps ago. Smaller models lose the plot. Opus 4.8 in particular handles long autonomous runs well — multi-step coding tasks that complete overnight without human correction.
- **Ambiguous specs.** A vague feature request from a PM, half a Slack thread, and a screenshot. Opus is the one that asks the right clarifying questions instead of guessing.
- **Writing-heavy work.** Opus 4.8 produces noticeably cleaner, warmer prose than prior Opus versions — worth using when the output quality of the text itself matters.

**Where it's the wrong choice:**

- Anything you're doing in a tight loop. The latency adds up.
- Shallow tasks — renaming, reformatting, generating boilerplate. You're paying for reasoning you're not using.
- Anything where you've already done the thinking and just need the model to execute. Sonnet will do it faster and just as well.
- Tightly-controlled pipelines where verbosity matters: Opus 4.8 narrates more during long agentic tasks and asks more clarifying questions on small decisions than prior versions. Easy to tune with a prompt, but worth knowing going in.

Fast Mode is not available on Opus 4.8. If latency is the bottleneck and you need Opus-tier reasoning, [`claude-opus-4-6-fast`](https://code.claude.com/docs/en/fast-mode) (Opus 4.6 Fast) remains a supported option.

## Sonnet 4.6 — the default workhorse

If I had to use one model for a month, it'd be Sonnet. It's the right answer most of the time, and the fact that it isn't the most expensive option is part of why.

**Where it shines:**

- **Everyday coding.** Writing a function, fixing a bug, adding tests. My rough estimate: Sonnet handles ~80% of what a senior engineer does in a day.
- **PR review and code review.** Strong enough to catch real issues, fast enough to run on every diff.
- **Documentation and explanations.** Generating, editing, summarizing. The reasoning ceiling rarely matters here.
- **Most agent tool-use.** If your agent loop is roughly a dozen steps and the tools are well-defined, Sonnet keeps up with Opus at a fraction of the cost.

**Where it falls down:**

- Deeply ambiguous tasks where the right move is to push back, not to guess. Sonnet will sometimes pick a plausible interpretation and run with it.
- Very long agentic chains. In my own loops, somewhere past 25–30 tool calls Sonnet starts to feel its limits — losing track of earlier context or repeating itself.
- Cross-cutting refactors where the model needs to hold the whole system in its head simultaneously.

The honest summary: if you're not sure, start here. Move up to Opus when you can articulate *why* the task needs it.

## Haiku 4.5 — when latency or volume wins

Haiku is the model people underestimate. It's not "Sonnet but worse" — it's a different shape of tool.

**Where it's the right choice:**

- **High-volume batch work.** Classifying 50k support tickets. Extracting structured data from 10k PDFs. Summarizing every commit in a quarter. The cost-per-call matters here, and Haiku is roughly 3x cheaper than Sonnet on both input and output tokens. Stack the [Batch API's 50% discount](https://platform.claude.com/docs/en/about-claude/pricing) on top and you're at an order of magnitude below Sonnet for non-interactive work.
- **Interactive UIs.** Anything where a human is watching a spinner. Haiku's latency makes the difference between "snappy" and "I'll come back to this tab."
- **Cheap routing and triage.** First-pass categorization before handing off to a bigger model. "Is this question about billing or product?" doesn't need Opus.
- **Subagents inside an Opus or Sonnet loop.** The orchestrator can be smart; the workers can be fast.

**Where it falls down:**

- Multi-step reasoning where each step depends on the last. Haiku will get the early steps right and lose the thread.
- Tool-use planning with more than a handful of tools. The model picks reasonable tools but plans the sequence less carefully.
- Anywhere you need the model to disagree with you. Haiku is more agreeable, which is usually wrong.

## How I actually pick

The decision rule, in the order I apply it. It starts with Haiku, not Opus, on purpose — cost and latency rule out the bigger models faster than capability rules them in.

1. **Is latency the user-visible constraint?** → Haiku. A slow answer is a worse answer here.
2. **Am I going to call this thousands of times?** → Haiku, unless per-call quality is load-bearing.
3. **Is the *thinking* the hard part — ambiguous, multi-file, or 20+ steps?** → Opus. You're paying for the reasoning you actually need.
4. **Otherwise** → Sonnet. The default exists for a reason.

In Claude Code, you can wire this in per agent. [Subagents take a `model` field](https://code.claude.com/docs/en/sub-agents) in frontmatter — `opus`, `sonnet`, `haiku`, or `inherit`:

```yaml
---
name: explore
description: Fast read-only search agent
model: haiku
tools: [Read, Grep, Glob]
---
```

An Opus main loop dispatching Haiku `Explore` subagents is a very effective pattern: deep reasoning where it counts, cheap parallelism where it doesn't.

## Takeaways

- Don't default to the most expensive model. For most everyday work it's a worse choice, not just a more expensive one — you'll wait longer for an answer that wasn't going to be better.
- Match the model to the *shape* of the task: depth, volume, or latency.
- In agentic systems, the orchestrator and the workers don't have to be the same model. Some of the biggest wins come from mixing.

Pick one task on your desk this week and try it on the tier below what you'd normally use. If the output holds up, you just cut your cost and your latency. If it doesn't, you've learned something specific about where that task needs to live.

## References

- [Anthropic — Models overview](https://platform.claude.com/docs/en/about-claude/models/overview)
- [Anthropic — Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- [Claude Code — Custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Claude Code — Fast mode](https://code.claude.com/docs/en/fast-mode)
