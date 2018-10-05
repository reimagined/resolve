import {
  COMMENT_CREATED,
  COMMENT_UPDATED,
  COMMENT_REMOVED
} from '../event_types'

export default options => ({
  Init: async store => {
    await store.defineTable('Comments', {
      indexes: {
        mainId: 'string',
        treeId: 'string',
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
      payload: { commentId, parentCommentId, content },
      timestamp
    } = event

    if (
      (await store.count('Comments', {
        commentId: parentCommentId,
        treeId
      })) === 0
    ) {
      if (parentCommentId != null) {
        return
      }

      await store.insert('Comments', {
        mainId: `${treeId}-root`,
        treeId,
        commentId: null,
        position: null,
        childCommentId: null,
        nestedLevel: 0,
        timestamp,
        content: null
      })
    }

    await store.insert('Comments', {
      mainId: `${treeId}-${commentId}`,
      treeId,
      commentId,
      position: null,
      childCommentId: null,
      nestedLevel: 0,
      timestamp,
      content
    })

    const parentComments = await store.find(
      'Comments',
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

      if (
        Number.isInteger(options.maxNestedLevel) &&
        nestedLevel > options.maxNestedLevel
      ) {
        continue
      }

      await store.insert('Comments', {
        mainId,
        treeId,
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
      'Comments',
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
      'Comments',
      { treeId, commentId, childCommentId: { $ne: null } },
      { childCommentId: 1 }
    ))
      .map(({ childCommentId }) => childCommentId)
      .concat(commentId)

    await store.delete('Comments', {
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
