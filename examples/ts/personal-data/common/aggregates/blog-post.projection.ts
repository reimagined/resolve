import { AggregateProjection } from '@resolve-js/core'
import { BLOG_POST_CREATED, BLOG_POST_DELETED } from '../blog-post.events'

const projection: AggregateProjection = {
  Init: () => ({
    isExist: false,
  }),
  [BLOG_POST_CREATED]: (state) => ({
    ...state,
    isExist: true,
  }),
  [BLOG_POST_DELETED]: (state) => ({
    ...state,
    isExist: false,
  }),
}

export default projection
