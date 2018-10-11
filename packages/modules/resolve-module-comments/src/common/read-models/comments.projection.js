import injectDefaults from '../inject-defaults'

const createCommentsProjection = ({
  eventTypes: { COMMENT_CREATED, COMMENT_UPDATED, COMMENT_REMOVED },
  commentsTableName,
  maxNestedLevel
}) => ({
  Init: async store => {
    await store.defineTable(commentsTableName, {
      indexes: {
        mainId: 'string',
        treeId: 'string',
        authorId: 'string',
        commentId: 'string',
        childCommentId: 'string',
        timestamp: 'number',
        nestedLevel: 'number'
      },
      fields: [
        'position', // string
        'content' // json
      ]
    })
  },

  [COMMENT_CREATED]: async (store, event) => {
    const {
      aggregateId: treeId,
      payload: { commentId, parentCommentId, authorId, content },
      timestamp
    } = event

    if (
      (await store.count(commentsTableName, {
        commentId: parentCommentId,
        treeId
      })) === 0
    ) {
      if (parentCommentId != null) {
        return
      }

      await store.insert(commentsTableName, {
        mainId: `${treeId}-root`,
        treeId,
        authorId,
        commentId: null,
        position: null,
        childCommentId: null,
        nestedLevel: 0,
        timestamp,
        content: null
      })
    }

    await store.insert(commentsTableName, {
      mainId: `${treeId}-${commentId}`,
      treeId,
      authorId,
      commentId,
      position: null,
      childCommentId: null,
      nestedLevel: 0,
      timestamp,
      content
    })

    const parentComments = await store.find(
      commentsTableName,
      {
        $or: [
          { treeId, commentId: parentCommentId, nestedLevel: 0 },
          { treeId, commentId: parentCommentId, nestedLevel: 1 },
          { treeId, childCommentId: parentCommentId, nestedLevel: { $ne: 0 } }
        ]
      },
      { timestamp: 0, content: 0 },
      { nestedLevel: 1, timestamp: -1 }
    )

    const parentInnerComments = []

    let newParentPosition = -1
    for (const parentComment of parentComments) {
      if (
        parentComment.commentId !== parentCommentId ||
        parentComment.nestedLevel === 0
      ) {
        parentInnerComments.push(parentComment)
        continue
      }
      if (parentComment.position == null) {
        continue
      }

      const parentPosition = Number(
        parentComment.position.split(/\./).reverse()[0]
      )
      if (parentPosition > newParentPosition) {
        newParentPosition = parentPosition
      }
    }

    newParentPosition++

    for (const parentComment of parentInnerComments) {
      const position =
        parentComment.position != null
          ? `${parentComment.position}.${newParentPosition}`
          : `${newParentPosition}`

      const mainId =
        parentComment.commentId != null
          ? `${treeId}-${parentComment.commentId}.${position}`
          : `${treeId}-root.${position}`

      const nestedLevel = parentComment.nestedLevel + 1

      if (Number.isInteger(maxNestedLevel) && nestedLevel > maxNestedLevel) {
        continue
      }

      await store.insert(commentsTableName, {
        mainId,
        treeId,
        authorId,
        commentId: parentComment.commentId,
        position,
        childCommentId: commentId,
        nestedLevel,
        timestamp,
        content
      })
    }
  },

  [COMMENT_UPDATED]: async (store, event) => {
    const {
      aggregateId: treeId,
      payload: { commentId, content }
    } = event

    await store.update(
      commentsTableName,
      {
        $or: [
          { treeId, commentId, nestedLevel: 0 },
          { treeId, childCommentId: commentId }
        ]
      },
      { $set: { content } }
    )
  },

  [COMMENT_REMOVED]: async (store, event) => {
    const {
      aggregateId: treeId,
      payload: { commentId }
    } = event

    const childCommentsIds = (await store.find(
      commentsTableName,
      { treeId, commentId, childCommentId: { $ne: null } },
      { childCommentId: 1 }
    ))
      .map(({ childCommentId }) => childCommentId)
      .concat(commentId)

    await store.delete(commentsTableName, {
      $or: [
        ...childCommentsIds.map(innerCommentId => ({
          childCommentId: innerCommentId
        })),
        ...childCommentsIds.map(innerCommentId => ({
          commentId: innerCommentId
        }))
      ]
    })
  }
})

export default injectDefaults(createCommentsProjection)
