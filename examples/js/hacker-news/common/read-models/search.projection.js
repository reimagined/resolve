import { STORY_CREATED, USER_CREATED } from '../event-types'
const searchProjection = {
  [STORY_CREATED]: async (es, { aggregateId, payload: { title, text } }) => {
    if (es) {
      await es.index({
        index: 'primary',
        id: aggregateId,
        body: {
          type: 'story',
          aggregateId,
          text: `${title} ${text}`,
        },
      })
    }
  },
  [USER_CREATED]: async (es, { aggregateId, payload: { name } }) => {
    if (es) {
      await es.index({
        index: 'primary',
        id: aggregateId,
        body: {
          aggregateId,
          type: 'user',
          text: name,
        },
      })
    }
  },
  /* from module "@resolve-js/module-comments" */
  COMMENT_CREATED: async (
    es,
    {
      aggregateId,
      payload: {
        commentId,
        content: { text },
      },
    }
  ) => {
    if (es) {
      await es.index({
        index: 'primary',
        id: commentId,
        body: {
          aggregateId,
          type: 'comment',
          text,
        },
      })
    }
  },
  COMMENT_REMOVED: async (es, { payload: { commentId } }) => {
    if (es) {
      await es.delete({
        index: 'primary',
        id: commentId,
      })
    }
  },
}
export default searchProjection
