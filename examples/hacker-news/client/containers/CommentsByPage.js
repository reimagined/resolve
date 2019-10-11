import React from 'react'
import { Redirect } from 'react-router-dom'

import Comment from '../components/Comment'
import Pagination from '../components/Pagination'
import { CommentsPaginateRenderless } from 'resolve-module-comments'

import { ITEMS_PER_PAGE } from '../constants'

class CommentsByPage extends React.PureComponent {
  render() {
    const {
      match: {
        params: { page }
      }
    } = this.props

    return page && !Number.isInteger(Number(page)) ? (
      <Redirect push to={`/error?text=No such page`} />
    ) : (
      <CommentsPaginateRenderless
        itemsOnPage={ITEMS_PER_PAGE}
        pageNumber={+page || 1}
      >
        {({ comments, paginationDone }) => (
          <div>
            {comments &&
              comments.map(comment => (
                <Comment
                  key={comment.commentId}
                  id={comment.commentId}
                  storyId={comment.treeId}
                  text={comment.content.text}
                  createdBy={comment.content.createdBy}
                  createdByName={comment.content.createdByName}
                  createdAt={comment.content.createdAt}
                  parentId={comment.content.parentId}
                />
              ))}
            <Pagination
              page={page}
              hasNext={!paginationDone}
              location="/comments"
            />
          </div>
        )}
      </CommentsPaginateRenderless>
    )
  }
}

export default CommentsByPage
