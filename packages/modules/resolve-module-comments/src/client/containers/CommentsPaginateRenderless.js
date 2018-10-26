import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import * as defaults from '../../common/defaults'
import { CommentsTreeRenderless } from './CommentsTreeRenderless'

export class CommentsPaginateRenderless extends React.PureComponent {
  static defaultProps = {
    children: ({ pageNumber, itemsOnPage, comments }) => {
      // eslint-disable-next-line
      console.log(
        `comments (pageNumber: ${pageNumber}, itemsOnPage: ${itemsOnPage}):`,
        comments
      )
      return null
    }
  }

  render() {
    const { children: Component, comments, ...props } = this.props

    return <Component {...props} comments={comments} />
  }
}

export const mapStateToOptions = (
  state,
  {
    readModelName = defaults.readModelName,
    resolverName = defaults.allCommentsPaginate,
    itemsOnPage,
    pageNumber
  }
) => ({
  readModelName,
  resolverName,
  resolverArgs: {
    itemsOnPage,
    pageNumber
  }
})

const mapStateToProps = (state, { data: { comments, paginationDone } }) => ({
  comments,
  paginationDone
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CommentsTreeRenderless)
)
