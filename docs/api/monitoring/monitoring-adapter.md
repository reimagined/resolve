---
id: monitoring-adapter
title: Monitoring Adapter
description: This document describes the interface that a monitoring adapter should expose.
---

A monitoring adapter implementation should expose the following interface:

| Member Name                     | Description |
| ------------------------------- | ----------- |
| [`error`](#error)               |             |
| [`execution`](#execution)       |             |
| [`duration`](#duration)         |             |
| [`time`](#time)                 |             |
| [`timeEnd`](#timeend)           |             |
| [`publish`](#publish)           |             |
| [`rate`](#rate)                 |             |
| [`performance`](#performance)   |             |
| [`group`](#group)               |             |
| [`getMetrics`](#getmetrics)     |             |
| [`clearMetrics`](#clearmetrics) |             |

All of the listed functions except for `publish` have a default implementation in the base package.

### `error`

### `execution`

### `duration`

### `time`

### `timeEnd`

### `publish`

### `rate`

### `performance`

### `group`

### `getMetrics`

### `clearMetrics`
