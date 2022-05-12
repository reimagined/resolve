---
id: comments
title: Comments
---

# Authentication Module

The reSolve comments module ([@resolve-js/module-comments](https://www.npmjs.com/package/@resolve-js/module-comments)) adds support for user comments in a reSolve application. In addition to aggregates and read models that describe the comments logic on the server side, the module exports renderless client components based on React + Redux and the [@resolve-js/redux](https://www.npmjs.com/package/@resolve-js/@resolve-js/redux) library that you can use to display comments on a page.

## Installation

Use the following console input to install the uploader module:

```sh
yarn add @resolve-js/module-comments
```

## Register and Configure the Module

Register the installed module in the project's `run.js` file:

```js
import resolveModuleComments from '@resolve-js/module-comments'

// See the `options` section below for the full list of available options.
const moduleComments = resolveModuleComments({
  commentsInstanceName: 'comments-hn',
  aggregateName: 'Comment',
  readModelName: 'Comments',
  readModelConnectorName: 'default',
  reducerName: 'comments',
})
const baseConfig = merge(
  defaultResolveConfig,
  appConfig,
  moduleComments,
  ....
)
...
```

## Options

The `resolveModuleComments` function takes an `options` object that can contain the following fields:

| Option Name              | Type       | Description                                                                         |
| ------------------------ | ---------- | ----------------------------------------------------------------------------------- |
| `aggregateName`          | `string`   | A custom name for the comments aggregate.                                           |
| `readModelName`          | `string`   | A custom name for the comments read model.                                          |
| `readModelConnectorName` | `string`   | The name of the connector to use with the comments read model.                      |
| `commentsTableName`      | `string`   | A custom name for the database table used to store the comments read model's state. |
| `eventTypes`             | `object`   | An object that contains custom names for event types used by the comments module.   |
| `commandTypes`           | `object`   | An object that contains custom names for command types used by the comments module. |
| `resolverNames`          | `object`   | An object that contains custom names for the comments read model's resolvers.       |
| `maxNestedLevel`         | `int`      | The maximum nesting level allowed for comments.                                     |
| `verifyCommand`          | `function` | A function that defines custom command verification logic.                          |
| `commentsInstanceName`   | `string`   | A custom name for a client import instance of the comments module.                  |
| `reducerName`            | `string`   | The name of the comments Redux reducer.                                             |

### `eventTypes`

### `commandTypes`

### `resolverNames`

### `verifyCommand`

```js
verifyCommand(state, command, jwt) {
  // Throw and error if verification fails.
}
```

```js
    eventTypes: {
      COMMENT_CREATED = defaults.COMMENT_CREATED,
      COMMENT_UPDATED = defaults.COMMENT_UPDATED,
      COMMENT_REMOVED = defaults.COMMENT_REMOVED,
    } = {},
    commandTypes: {
      createComment = defaults.createComment,
      updateComment = defaults.updateComment,
      removeComment = defaults.removeComment,
    } = {},
    resolverNames: {
      commentsTree = defaults.commentsTree,
      foreignCommentsCount = defaults.foreignCommentsCount,
      allCommentsPaginate = defaults.allCommentsPaginate,
    } = {},
```

## Client API
