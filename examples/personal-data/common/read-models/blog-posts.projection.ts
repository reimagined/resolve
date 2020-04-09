import { ReadModel } from 'resolve-readmodel-base'
import { BLOG_POST_CREATED, BLOG_POST_DELETED } from '../blog-post.events'

const readModel: ReadModel = {
  Init: async (store): Promise<void> => {
    await store.defineTable('BlogPosts', {
      indexes: { author: 'string', id: 'string' },
      fields: ['timestamp', 'content']
    })
  },
  [BLOG_POST_CREATED]: async (store, event): Promise<void> => {
    const {
      aggregateId,
      timestamp,
      payload: { authorId, content }
    } = event

    await store.insert('Users', {
      author: authorId,
      id: aggregateId,
      timestamp,
      content
    })
  },
  [BLOG_POST_DELETED]: async (store, event): Promise<void> =>
    store.delete('BlogPosts', {
      id: event.aggregateId
    })
}

export default readModel
