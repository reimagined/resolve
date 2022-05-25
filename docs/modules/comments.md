---
id: comments
title: Comments
---

# Comments Module

```mdx-code-block
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
```

The reSolve comments module ([@resolve-js/module-comments](https://www.npmjs.com/package/@resolve-js/module-comments)) adds support for user comments to a reSolve application. It implements an aggregate and a read model that together describe the logic used to process hierarchical trees of comments and serve them to a client.

The comments module also exports renderless [client components](#client-api) based on React+Redux and the [@resolve-js/redux](https://www.npmjs.com/package/@resolve-js/@resolve-js/redux) library that you can use to implement a user interface required to post and navigate comments on your web application's page.

## Installation

Use the following console input to install the comments module:

```sh
yarn add @resolve-js/module-comments
```

## Register and Configure the Module

Register the installed module in the project's `run.js` file:

```js
import { merge } from '@resolve-js/scripts'
import resolveModuleComments from '@resolve-js/module-comments'

// All of the options specified below are optional.
const moduleComments = resolveModuleComments({
  aggregateName: 'CustomCommentsAggregateName', // default = 'Comments'
  readModelName: 'CustomCommentsReadModelName', // default = 'Comments'
  readModelConnector: {
    module: 'CustomreadModelConnector', // default = @resolve-js/readmodel-lite'
    options: {}, // default = {}
  },
  commentsTableName: 'CustomCommentsTableName', // default = 'Comments'
  reducerName: 'CustomReducerName', // default = 'comments'
  eventTypes: {
    COMMENT_CREATED: 'CUSTOM_COMMENT_CREATED', // default = 'COMMENT_CREATED'
    COMMENT_UPDATED: 'CUSTOM_COMMENT_UPDATED', // default = 'COMMENT_UPDATED'
    COMMENT_REMOVED: 'CUSTOM_COMMENT_REMOVED', // default = 'COMMENT_REMOVED'
  },
  commandTypes: {
    createComment: 'customCreateComment', // default = 'createComment'
    updateComment: 'customUpdateComment', // default = 'updateComment'
    removeComment: 'customRemoveComment', // default = 'removeComment'
  },
  resolverNames: {
    commentsTree: 'customCommentsTree', // default = 'commentsTree',
    foreignCommentsCount: 'customForeignCommentsCount', // default = 'foreignCommentsCount',
    allCommentsPaginate: 'customAllCommentsPaginate', // default = 'allCommentsPaginate'
  },
  maxNestedLevel: 2, // default = undefined
  verifyCommand: path.join(__dirname, 'customVerifyCommand.js'), // default = '@resolve-js/module-comments/lib/aggregates/verify-command.js'
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

The `resolveModuleComments` function that initializes the comments module takes an `options` object that can contain the following fields:

| Option Name              | Type                      | Description                                                                         |
| ------------------------ | ------------------------- | ----------------------------------------------------------------------------------- |
| `aggregateName`          | `string`                  | A custom name for the comments aggregate.                                           |
| `readModelName`          | `string`                  | A custom name for the comments read model.                                          |
| `readModelConnectorName` | `string`                  | The name of the connector to use with the comments read model.                      |
| `commentsTableName`      | `string`                  | A custom name for the database table used to store the comments read model's state. |
| `eventTypes`             | [`object`](#eventtypes)   | An object that contains custom names for event types used by the comments module.   |
| `commandTypes`           | [`object`](#commandtypes) | An object that contains custom names for command types used by the comments module. |
| `resolverNames`          | [`object`](#commandtypes) | An object that contains custom names for the comments read model's resolvers.       |
| `maxNestedLevel`         | `int`                     | The maximum nesting level allowed for comments.                                     |
| `verifyCommand`          | `function`                | A function that defines custom command verification logic.                          |
| `commentsInstanceName`   | `string`                  | A custom name for a client import instance of the comments module.                  |
| `reducerName`            | `string`                  | The name of the comments Redux reducer.                                             |

### `eventTypes`

The `eventTypes` option is an object whose fields specify custom names for the comments module's events. This object can contain any of the following fields:

```js
{
  COMMENT_CREATED,
  COMMENT_UPDATED,
  COMMENT_REMOVED,
}
```

### `commandTypes`

The `commandTypes` option is an object whose fields specify custom names for the comments module's commands. This object can contain any of the following fields:

```js
{
  createComment,
  updateComment,
  removeComment,
}
```

### `resolverNames`

The `resolverNames` option is an object whose fields specify custom names for the comments read model's resolvers. This object can contain any of the following fields:

```js
  commentsTree,          // Returns a hierarchical tree of comments.
  foreignCommentsCount,  // Returns the number of comments left by other users.
  allCommentsPaginate,   // Returns comments with pagination.
```

### `verifyCommand`

The `verifyCommand` option accepts a callback function of the following signature:

<!-- prettier-ignore-start -->

```js
(state, command, jwt) => {
  // Place your custom logic here.
  // Throw an error if verification fails.
}
```

<!-- prettier-ignore-end -->

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
  parentCommentId, // Optional. The ID of the parent comment.
  content,         // An object that contains data associated with the comment (text, timestamp, title, and so on).
}
```

#### `updateComment`

Updates an existing comment.

**Payload**

The `updateComment` command requires a payload object of the following structure:

```js
{
  authorId,  // The comment author's unique ID.
  commentId, // The comment's unique ID.
  content,   // An object that contains data associated with the comment (text, timestamp, title, and so on).
}
```

#### `removeComment`

Removes an existing comment.

**Payload**

The `removeComment` command requires a payload object of the following structure:

```js
{
  authorId,  // The comment author's unique ID.
  commentId, // The comment's unique ID.
}
```

### Resolvers

The comments module's read model (named `"Comments"` by default) has the following resolvers:

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
| `authorId`        | The identifier of a user whose comments are obtained.           |
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

The comments ([@resolve-js/module-comments](https://www.npmjs.com/package/@resolve-js/module-comments)) package exports renderless React+Redux components that you can use to implement your own UI for user comments. The following components are available:

| Component Name                                                      | Description                                                                      |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`CommentsNotificationRenderless`](#commentsnotificationrenderless) | A component used to display a notification about a new comment.                  |
| [`RefreshHelperRenderless`](#refreshhelperrenderless)               | A component that allows the application to refresh comments without page reload. |
| [`CommentsPaginateRenderless`](#commentspaginaterenderless)         | A container used to render comments in a paginated view.                         |
| [`CommentsTreeRenderless`](#resolvernames)                          | A container used to render comments in a hierarchical view.                      |

### `CommentsNotificationRenderless`

A component that displays a notification about new comments.

**Usage**

```js
import React from 'react'
import { CommentsNotificationRenderless } from '@resolve-js/module-comments'

export const CommentsNotification = (props) => (
  <CommentsNotificationRenderless
    treeId="treeId"
    parentCommentId="parentCommentId"
    authorId="authorId"
    checkInterval={10000} // default = 30 * 1000
    readModelName="customReadModelName" // default = 'readModelName'
    resolverName="customResolverName" // default = 'foreignCommentsCount'
    {...props}
  >
    {({ count, onClick }) => {
      // Replace with your code.
      if (count === 0) return null
      return (
        <div onClick={onClick}>
          Comments have been updated. Refresh the page to see the new comments.
        </div>
      )
    }}
  </CommentsNotificationRenderless>
)
```

The `CommentsNotificationRenderless` component takes the following props:

| Prop Name         | Description                                                          |
| ----------------- | -------------------------------------------------------------------- |
| `checkInterval`   | The time interval in milliseconds between checks for updates.        |
| `readModelName`   | The name of the comments read model.                                 |
| `resolverName`    | The name of the comments read model's resolver.                      |
| `onClick`         | A callback function that handles a user's click on the notification. |
| `treeId`          | The unique identifier of the current comment tree.                   |
| `parentCommentId` | The unique identifier of the parent comment.                         |
| `authorId`        | The comment author's unique identifier.                              |

This component passes all its props to its direct child.

The child component also receives the following additional props:

| Prop Name | Description                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------------- |
| `onClick` | Resets the notification and calls the `CommentsNotificationRenderless` component's `onClick` callback if it is specified. |
| `count`   | The number of new comments.                                                                                               |

### `RefreshHelperRenderless`

A component that allows the application to refresh a comment without page reload.

**Usage**

```js
import React from 'react'
import { RefreshHelperRenderless } from '@resolve-js/module-comments'

export const RefreshHelper = () => (
  <RefreshHelperRenderless>
    {({ refreshId, refresh }) => <div onClick={refresh}>{refreshId}</div>}
  </RefreshHelperRenderless>
)
```

The `RefreshHelperRenderless` component passes the following props to its direct child:

| Prop Name   | Description                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------- |
| `refreshId` | A randomly generated ID that can be assigned to a child that needs to be re-rendered.             |
| `refresh`   | A function with no arguments that assigns a new random value to `refreshID` to force a re-render. |

### `CommentsPaginateRenderless`

A container used to render comments in a paginated view.

**Usage**

```js
import React from 'react'
import { CommentsPaginateRenderless } from '@resolve-js/module-comments'

export const CommentsPaginate = ({ itemsOnPage }) => (
  <CommentsPaginateRenderless
    itemsOnPage
    pageNumber
    readModelName="customReadModelName" // default = 'readModelName'
    resolverName="customAllCommentsPaginate" // default = 'allCommentsPaginate'
  >
    {({ pageNumber, comments }) => {
      // Replace with your code.
      console.log(
        `comments (pageNumber: ${pageNumber}, itemsOnPage: ${itemsOnPage}):`,
        comments
      )
      return null
    }}
  </CommentsPaginateRenderless>
)
```

The `CommentsPaginateRenderless` component takes the following props:

| Prop Name       | Description                                     |
| --------------- | ----------------------------------------------- |
| `itemsOnPage`   | The number of comments on a single page.        |
| `pageNumber`    | The number of the page to display.              |
| `readModelName` | The name of the comments read model.            |
| `resolverName`  | The name of the comments read model's resolver. |

This component passes all its props to its direct child.

The child component also receives the following additional props:

| Prop Name        | Description                                                             |
| ---------------- | ----------------------------------------------------------------------- |
| `comments`       | A list of comment data objects.                                         |
| `paginationDone` | A `boolean` value that indicates if there are no more pages to display. |

A comment object has the following structure:

```js
{
  commentId, // The comment's unique identifier.
  treeId, // The unique identifier of a comment tree to which the comment belongs.
  content, // An object that contains the comment's data.
}
```

### `CommentsTreeRenderless`

A container used to render comments in a hierarchical view.

**Usage**

```js
import React from 'react'
import { CommentsTreeRenderless } from '@resolve-js/module-comments'

export const CommentsTree = (props) => (
  <CommentsTreeRenderless
    treeId="treeId"
    parentCommentId="parentCommentId"
    authorId="authorId"
    readModelName="customReadModelName" // default = 'readModelName'
    resolverName="customAllCommentsPaginate" // default = 'allCommentsPaginate'
  >
    {({ comments, createComment, updateComment, removeComment }) => {
      // Replace with your code.
      console.log('comments:', comments)
      return null
    }}
  </CommentsTreeRenderless>
)
```

The `CommentsTreeRenderless` component takes the following props:

| Prop Name         | Description                                                             |
| ----------------- | ----------------------------------------------------------------------- |
| `treeId`          | The unique identifier of a comment tree to display.                     |
| `parentCommentId` | The unique identifier of a comment for which to display child comments. |
| `authorId`        | The unique identifier of an author whose comments are displayed.        |
| `readModelName`   | The name of the comments read model.                                    |
| `resolverName`    | The name of the comments read model's resolver.                         |

This component passes all its props to its direct child.

The child component also receives the following additional props:

| Prop Name       | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `comments`      | A list of comment data objects.                                    |
| `createComment` | A function that dispatches a Redux action to create a new comment. |
| `updateComment` | A function that dispatches a Redux action to update a comment.     |
| `removeComment` | A function that dispatches a Redux action to delete a comment.     |

A comment object has the following structure:

```js
{
  commentId, // The comment's unique identifier.
  treeId, // The unique identifier of a comment tree to which the comment belongs.
  children, // A list of the current comment's child comments.
  content, // An object that contains the comment's data.
}
```

Use the `createComment`, `updateComment`, and `removeComment` functions to implement data editing operations on comments as the code samples below demonstrate:

<Tabs>
<TabItem value="createcomment" label="createComment" default>

```js
createComment(treeId, {
  commentId: uuid(),
  authorId: me.id,
  parentCommentId,
  content: {
    text: comment.current.value,
    createdBy: me.id,
    createdByName: me.name,
    createdAt: Date.now(),
  },
})
```

</TabItem>

<TabItem value="updatecomment" label="updateComment" default>

```js
updateComment(treeId, {
  commentId: id,
  content: updatedContent,
})
```

</TabItem>

<TabItem value="removecomment" label="removeComment" default>

```js
removeComment(treeId, {
  commentId: id,
})
```

</TabItem>

</Tabs>

### Example

The [Hacker News](https://github.com/reimagined/resolve/tree/dev/examples/js/hacker-news) example application makes extensive use of the comment module's client components.
