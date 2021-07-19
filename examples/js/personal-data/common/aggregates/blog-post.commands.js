import { BLOG_POST_CREATED, BLOG_POST_DELETED } from '../blog-post.events'
const aggregate = {
  create: (state, command, { user }) => {
    const { authorId, content, title } = command.payload
    if (user.userId !== authorId) {
      throw Error(`you are not authorized to perform this operation`)
    }
    const { isExist } = state
    if (isExist) {
      throw Error(`the blog post already exist`)
    }
    return {
      type: BLOG_POST_CREATED,
      payload: {
        authorId,
        content,
        title,
      },
    }
  },
  delete: (state, command, { user }) => {
    const { isExist, authorId } = state
    if (!isExist) {
      throw Error(`the blog post not exist`)
    }
    if (user.userId !== authorId) {
      throw Error(`you are not authorized to perform this operation`)
    }
    return {
      type: BLOG_POST_DELETED,
    }
  },
}
export default aggregate
