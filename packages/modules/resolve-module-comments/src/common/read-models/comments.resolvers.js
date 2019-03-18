import injectDefaults from '../inject-defaults'

const createCommentsProjection = ({
  commentsTableName,
  resolverNames: { commentsTree, foreignCommentsCount, allCommentsPaginate },
  maxNestedLevel
}) => ({
  [commentsTree]: async (store, args) => {
    const { treeId, parentCommentId, maxLevel } = args
    const parentId = parentCommentId != null ? parentCommentId : null

    if (treeId == null) {
      throw new Error(
        'Comments can be fetched only for supposed "treeId" field'
      )
    }

    let searchLevel = []
    if (maxLevel != null) {
      const maxLevelInt = parseInt(maxLevel)

      if (
        maxLevelInt < 0 ||
        (Number.isInteger(maxNestedLevel) && maxLevelInt > maxNestedLevel)
      ) {
        throw new Error(
          `Field "maxLevel" if present should be number between 0 and ${maxNestedLevel}`
        )
      }

      searchLevel = [
        {
          $or: Array.from({ length: maxLevelInt }).map((_, idx) => ({
            nestedLevel: idx
          }))
        }
      ]
    }

    const searchExpression = {
      $and: [{ commentId: parentId, treeId }, ...searchLevel]
    }

    const fieldFilterExpression = {
      childCommentId: 1,
      position: 1,
      content: 1,
      timestamp: 1
    }

    const sortExpression = {
      nestedLevel: 1,
      timestamp: 1
    }

    const linearizedComments = await store.find(
      commentsTableName,
      searchExpression,
      fieldFilterExpression,
      sortExpression
    )

    const treeComments = { children: [] }

    for (const comment of linearizedComments) {
      if (comment.childCommentId === null) {
        treeComments.commentId = parentId
        treeComments.content = comment.content
        treeComments.timestamp = comment.timestamp
        continue
      }

      let positionalArray = treeComments.children
      const path = comment.position.split(/\./g)

      for (let idx = 0; idx < path.length - 1; idx++) {
        positionalArray = positionalArray[path[idx]].children
      }

      positionalArray[path[path.length - 1]] = {
        commentId: comment.childCommentId,
        content: comment.content,
        timestamp: comment.timestamp,
        children: []
      }
    }

    return treeComments
  },

  [foreignCommentsCount]: async (store, args) => {
    const { treeId, parentCommentId, authorId, maxLevel } = args
    const parentId = parentCommentId != null ? parentCommentId : null

    if (authorId == null) {
      throw new Error(
        'Comments can be fetched only for supposed "authorId" field'
      )
    }

    if (treeId == null) {
      throw new Error(
        'Comments can be fetched only for supposed "treeId" field'
      )
    }

    let searchLevel = []
    if (maxLevel != null) {
      const maxLevelInt = parseInt(maxLevel)

      if (
        maxLevelInt < 0 ||
        (Number.isInteger(maxNestedLevel) && maxLevelInt > maxNestedLevel)
      ) {
        throw new Error(
          `Field "maxLevel" if present should be number between 0 and ${maxNestedLevel}`
        )
      }

      searchLevel = [
        {
          $or: Array.from({ length: maxLevelInt }).map((_, idx) => ({
            nestedLevel: idx
          }))
        }
      ]
    }

    const searchExpression = {
      $and: [
        {
          commentId: parentId,
          treeId,
          authorId: { $ne: authorId }
        },
        ...searchLevel
      ]
    }

    const count = await store.count(commentsTableName, searchExpression)

    return count
  },

  [allCommentsPaginate]: async (store, args) => {
    const { itemsOnPage, pageNumber } = args

    const itemsOnPageInt = +itemsOnPage
    const pageNumberInt = +pageNumber - 1
    if (
      !Number.isInteger(itemsOnPageInt) ||
      !Number.isInteger(pageNumberInt) ||
      itemsOnPageInt < 0 ||
      pageNumberInt < 0
    ) {
      throw new Error(
        'Fields "itemsOnPage" and "pageNumber" should be positive integers'
      )
    }

    const searchExpression = {
      commentId: null,
      nestedLevel: { $ne: 0 }
    }

    const fieldFilterExpression = {
      treeId: 1,
      childCommentId: 1,
      content: 1,
      timestamp: 1
    }

    const sortExpression = {
      timestamp: -1
    }

    const linearizedComments = await store.find(
      commentsTableName,
      searchExpression,
      fieldFilterExpression,
      sortExpression,
      itemsOnPageInt * pageNumberInt,
      itemsOnPageInt + 1
    )

    const paginationDone = linearizedComments.length <= itemsOnPageInt
    if (!paginationDone) {
      linearizedComments.pop()
    }

    return {
      comments: linearizedComments.map(({ childCommentId, ...rest }) => ({
        commentId: childCommentId,
        ...rest
      })),
      paginationDone
    }
  }
})

export default injectDefaults(createCommentsProjection)
