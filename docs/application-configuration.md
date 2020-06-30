---
id: application-configuration
title: Application Configuration
---

A reSolve application has a number of configuration files that define configuration options for different run targets.

## Overview

## Reference

#### aggregates

Specifies an array of the application's aggregates. An aggregate configuration object within this array contains the following fields:

| Field            | Description |
| ---------------- | ----------- |
| name             |             |
| commands         |             |
| projection       |             |
| serializeState   |             |
| deserializeState |             |
| encryption       |             |
| dependencies     |             |

#### readModels

Specifies an array of the application's Read Models. A Read Model configuration object within this array contains the following fields:

| Field         | Description |
| ------------- | ----------- |
| name          |             |
| projection    |             |
| resolvers     |             |
| connectorName |             |
