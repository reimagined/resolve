import { BLOG_POST_CREATED, BLOG_POST_DELETED } from '../blog-post.events'
import { Aggregate } from 'resolve-core'
import { decode } from '../jwt'

const aggregate: Aggregate = {
  create: (state, command, { jwt }) => {
    const { authorId, content, title } = command.payload

    const user = decode(jwt)
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
        title
      }
    }
  },
  delete: state => {
    const { isExist } = state

    if (!isExist) {
      throw Error(`the blog post not exist`)
    }

    return {
      type: BLOG_POST_DELETED
    }
  }
}

export default aggregate
