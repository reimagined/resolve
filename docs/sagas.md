---
id: sagas
title: Sagas
---

A saga describes a long-running process. A saga describes a process as a sequence of events and side effects.

You can define a saga as a set of projection functions. Each projection function runs in response to a specific event and can perform one of the following actions:

- Send a command to an aggregate
- Schedule a command with the specified time offset
- Trigger a side effect

The code sample below demonstrates a saga that requires a newly registered web site user to confirm their email address in a given time period.

# Handle Events With Projection Functions

# Send Aggregate Commands

# Schedule Aggregate Commands

# Use Side Effects
