const treeId = 'tree-id'

const projection = {
  Init: async store => {
    await store.defineTable('CommentsAsMap', {
      indexes: { treeId: 'string' },
      fields: ['comments']
    })

    await store.defineTable('CommentsAsList', {
      indexes: { treeId: 'string' },
      fields: ['comments', 'commentsCount']
    })

    await store.insert('CommentsAsMap', {
      treeId,
      comments: {}
    })

    await store.insert('CommentsAsList', {
      treeId,
      comments: [],
      commentsCount: 0
    })
  },

  COMMENT_CREATED: async (store, event) => {
    const {
      aggregateId,
      payload: { parentId, content }
    } = event

    await store.update(
      'CommentsAsMap',
      {
        treeId
      },
      {
        $set: {
          [`comments.${aggregateId}`]: {
            aggregateId,
            parentId,
            content,
            children: {},
            childrenCount: 0
          }
        }
      }
    )

    if (parentId != null) {
      await store.update(
        'CommentsAsMap',
        {
          treeId
        },
        {
          $set: {
            [`comments.${parentId}.children.${aggregateId}`]: true
          },
          $inc: {
            [`comments.${parentId}.childrenCount`]: 1
          }
        }
      )
    }

    const { commentsCount } = await store.findOne(
      'CommentsAsList',
      {
        treeId
      },
      {
        commentsCount: 1
      }
    )

    if (parentId != null) {
      const comments = (await store.findOne(
        'CommentsAsList',
        {
          treeId
        },
        {
          comments: 1
        }
      )).comments

      const parentIndex = comments.findIndex(
        ({ aggregateId }) => aggregateId === parentId
      )

      await store.update(
        'CommentsAsList',
        {
          treeId
        },
        {
          $set: {
            [`comments.${parentIndex}.children.${aggregateId}`]: true
          },
          $inc: {
            [`comments.${parentIndex}.childrenCount`]: 1
          }
        }
      )
    }

    await store.update(
      'CommentsAsList',
      {
        treeId
      },
      {
        $set: {
          [`comments.${commentsCount}`]: {
            aggregateId,
            parentId,
            content,
            children: {},
            childrenCount: 0
          }
        },
        $inc: {
          commentsCount: 1
        }
      }
    )
  }
}

export default projection
