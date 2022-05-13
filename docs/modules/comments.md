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

The `eventTypes` option is an object whose fields specify custom names for the comments module's events. This object can contain all or some of the following fields:

```js
{
  COMMENT_CREATED,
  COMMENT_UPDATED,
  COMMENT_REMOVED,
}
```

### `commandTypes`

The `commandTypes` option is an object whose fields specify custom names for the comments module's commands. This object can contain all or some of the following fields:

```js
{
  createComment,
  updateComment,
  removeComment,
}
```

### `resolverNames`

The `resolverNames` option is an object whose fields specify custom names for the comments read model's resolvers. This object can contain all or some of the following fields:

```js
  commentsTree,          // Returns a hierarchical tree of comments.
  foreignCommentsCount,  // Returns the number of comments left by other users.
  allCommentsPaginate,   // Returns comments with pagination.
```

### `verifyCommand`

The `verifyCommand` option accepts a function of the following signature:

```js
verifyCommand(state, command, jwt) {
  // Throw and error if verification fails.
}
```

## Server API

### Commands

The following command types are handled by the comments module's aggregate:

| Default Name                      | Description                  |
| --------------------------------- | ---------------------------- |
| [`createComment`](#createcomment) | Creates a new comment.       |
| [`updateComment`](#updatecomment) | Updates an existing comment. |
| [`removeComment`](#removecomment) | Removes an existing comment. |

#### `createComment`

Creates a new comment.

**Payload**

The `createComment` command requires a payload object of the following structure:

```js
{
  authorId,        // The comment author's unique ID.
  commentId,       // The new comment's unique ID.
  parentCommentId, // (optional) The ID of the parrent comment.
  content,         // The text of the comment.
}
```

#### `updateComment`

Updates an existing comment.

**Payload**

The `updateComment` command requires a payload object of the following structure:

```js
{
  authorId,  // The comment author's unique ID.
  commentId, // The new comment's unique ID.
  content,   // The text of the comment.
}
```

#### `removeComment`

Removes an existing comment.

**Payload**

The `removeComment` command requires a payload object of the following structure:

```js
{
  authorId,  // The comment author's unique ID.
  commentId, // The new comment's unique ID.
}
```

### Resolvers

The comments module's read model (named `"Comments"` by default) has the following resolver's:

| Default Name                                    | Description                                         |
| ----------------------------------------------- | --------------------------------------------------- |
| [`commentsTree`](#commentstree)                 | Returns a hierarchical tree of comments.            |
| [`foreignCommentsCount`](#foreigncommentscount) | Returns the number of comments left by other users. |
| [`allCommentsPaginate`](#allcommentspaginate)   | Returns comments with pagination.                   |

#### `commentsTree`

Returns a hierarchical tree of comments.

**Arguments**

| Argument Name     | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `treeId`          | The unique identifier of a comment tree.                        |
| `parentCommentId` | The identifier of a comment for which to obtain child comments. |
| `authorId`        | The identifier of user whose comments to obtain.                |
| `maxLevel`        | The maximum nesting level of the comments to load.              |

#### `foreignCommentsCount`

Returns the number of comments left by other users.

**Arguments**

| Argument Name     | Description                                                     |
| ----------------- | --------------------------------------------------------------- |
| `treeId`          | The unique identifier of a comment tree.                        |
| `parentCommentId` | The identifier of a comment for which to obtain child comments. |
| `maxLevel`        | The maximum nesting level of the comments to load.              |

#### `allCommentsPaginate`

Returns comments with pagination.

**Arguments**

| Argument Name | Description                       |
| ------------- | --------------------------------- |
| `itemsOnPage` | The number of comments on a page. |
| `pageNumber`  | The number of the page to load.   |

## Client API
