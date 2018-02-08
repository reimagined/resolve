# **resolve-bus-memory**
[![npm version](https://badge.fury.io/js/resolve-bus-memory.svg)](https://badge.fury.io/js/resolve-bus-memory)

This package is a `resolve-es` adapter for emitting events. It is useful for development only as it is used inside an application instance which must include both query and command parts.

## Usage

```js
import createAdapter from 'resolve-bus-memory'

const adapter = createAdapter()
```
