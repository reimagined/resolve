# **@resolve-js/module-comments**

[![npm version](https://badge.fury.io/js/%40resolve-js%2Fmodule-comments.svg)](https://badge.fury.io/js/%40resolve-js%2Fmodule-comments)

## Usage

```js
import { merge } from '@resolve-js/scripts'
import createModuleComments from '@resolve-js/module-comments'

merge(resolveConfig, createModuleComments())
```

#### Customization of module options

```js
import { merge } from '@resolve-js/scripts'
import createModuleComments from '@resolve-js/module-comments'

merge(
  resolveConfig,
  createModuleComments({
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
)
```

#### Customization of verifyCommand

```js
// customVerifyCommand.js

const verifyCommand = async (state, command, jwt) => {
  // ...
}

export default verifyCommand
```

![Analytics](https://ga-beacon.appspot.com/UA-118635726-1/packages-@resolve-js/module-comments-readme?pixel)

#### Commands

```js
createComment(aggregateId, {
  authorId,
  commentId,
  parentCommentId,
  content,
})

updateComment(aggregateId, {
  authorId,
  commentId,
  content,
})

removeComment(aggregateId, {
  authorId,
  commentId,
})
```

#### Renderless Connectors

```js
import React from 'react'

import {
  CommentsTreeRenderless,
  CommentsPaginateRenderless,
  CommentsNotificationRenderless,
  RefreshHelperRenderless,
} from '@resolve-js/module-comments'

export const CommentsTree = (props) => (
  <CommentsTreeRenderless
    treeId="treeId"
    parentCommentId="parentCommentId"
    authorId="authorId"
  >
    {({ comments, createComment, renameComment, removeComment }) => {
      // eslint-disable-next-line
      console.log('comments:', comments)
      return null
    }}
  </CommentsTreeRenderless>
)

export const CommentsPaginate = ({ itemsOnPage }) => (
  <CommentsPaginateRenderless
    itemsOnPage
    pageNumber
    readModelName="customReadModelName" // default = 'readModelName'
    resolverName="customAllCommentsPaginate" // default = 'allCommentsPaginate'
  >
    {({ pageNumber, comments }) => {
      // eslint-disable-next-line
      console.log(
        `comments (pageNumber: ${pageNumber}, itemsOnPage: ${itemsOnPage}):`,
        comments
      )
      return null
    }}
  </CommentsPaginateRenderless>
)

export const CommentsNotification = (props) => (
  <CommentsNotificationRenderless
    treeId="treeId"
    parentCommentId="parentCommentId"
    authorId="authorId"
    readModelName="customReadModelName" // default = 'readModelName'
    resolverName="customResolverName" // default = 'foreignCommentsCount'
    {...props}
  >
    {({ count, onClick }) => {
      if (count === 0) return null
      return (
        <div onClick={onClick}>
          Comments have been updated - refresh page to see them
        </div>
      )
    }}
  </CommentsNotificationRenderless>
)

export const RefreshHelper = () => (
  <RefreshHelperRenderless>
    {({ refreshId, refresh }) => <div onClick={refresh}>{refreshId}</div>}
  </RefreshHelperRenderless>
)
```
