import { STORY_CREATED, USER_CREATED } from '../event-types'

const ifExist = async (es, fn) => {
  if (es) return fn(es)
}

export default {
  [STORY_CREATED]: async (es, { aggregateId, payload: { title, text } }) =>
    ifExist(es, es =>
      es.create({
        index: 'primary',
        type: 'story',
        id: aggregateId,
        body: {
          aggregateId,
          text: `${title} ${text}`
        }
      })
    ),

  [USER_CREATED]: async (es, { aggregateId, payload: { name } }) =>
    ifExist(es, es =>
      es.create({
        index: 'primary',
        type: 'user',
        id: aggregateId,
        body: {
          aggregateId,
          text: name
        }
      })
    ),

  /* from module "resolve-module-comments" */
  COMMENT_CREATED: async (
    es,
    {
      aggregateId,
      payload: {
        commentId,
        content: { text }
      }
    }
  ) =>
    ifExist(es, es =>
      es.create({
        index: 'primary',
        type: 'comment',
        id: commentId,
        body: {
          aggregateId,
          text
        }
      })
    ),

  COMMENT_REMOVED: async (es, { payload: { commentId } }) =>
    ifExist(es, es =>
      es.delete({
        index: 'primary',
        type: 'comment',
        id: commentId
      })
    )
}
