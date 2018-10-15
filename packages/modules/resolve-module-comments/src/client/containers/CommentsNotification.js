import React from 'react'
import CommentCountUpdater from './CommentCountUpdater'

import * as defaults from '../../common/defaults'

class CommentsNotification extends React.PureComponent {
  static defaultProps = {
    refreshInterval: 30 * 1000,
    children: ({ count }) => {
      // eslint-disable-next-line
      console.log(`commentCount - prevCommentCount = ${count}`)
      return null
    },
    readModelName: defaults.readModelName,
    resolverName: defaults.foreignCommentsCount
  }

  state = {
    timestamp: Date.now(),
    commentCount: null,
    prevCommentCount: null
  }

  componentDidMount() {
    this.timer = setInterval(this.updateTimestamp, this.props.refreshInterval)
  }

  componentWillUnmount() {
    clearInterval(this.timer)
  }

  updateTimestamp = () => {
    this.setState({
      timestamp: Date.now()
    })
  }

  updateCommentCount = commentCount => {
    if (this.state.commentCount === commentCount) {
      return
    }

    const prevCommentCount =
      this.state.commentCount === null ? commentCount : this.state.commentCount

    this.setState({
      prevCommentCount,
      commentCount
    })
  }

  refresh = () => {
    if (this.props.refresh) {
      this.props.refresh()
    }
    this.setState({
      commentCount: null,
      prevCommentCount: null
    })
  }

  render() {
    const {
      readModelName,
      resolverName,
      treeId,
      parentCommentId,
      authorId,
      children: Component,
      ...props
    } = this.props

    const { commentCount, prevCommentCount, timestamp } = this.state

    if (readModelName == null || readModelName.constructor !== String) {
      throw new Error('Props "readModelName" must be a string')
    }
    if (resolverName == null || resolverName.constructor !== String) {
      throw new Error('Props "resolverName" must be a string')
    }
    if (treeId == null || treeId.constructor !== String) {
      throw new Error('Props "resolverName" must be a string')
    }
    if (parentCommentId != null && parentCommentId.constructor !== String) {
      throw new Error('Props "parentCommentId" must be a string')
    }
    if (authorId == null || authorId.constructor !== String) {
      throw new Error('Props "authorId" must be a string')
    }

    return (
      <React.Fragment>
        <CommentCountUpdater
          {...props}
          readModelName={readModelName}
          resolverName={resolverName}
          treeId={treeId}
          parentCommentId={parentCommentId}
          authorId={authorId}
          timestamp={timestamp}
          updateCommentCount={this.updateCommentCount}
        />
        <Component
          {...props}
          readModelName={readModelName}
          resolverName={resolverName}
          treeId={treeId}
          parentCommentId={parentCommentId}
          authorId={authorId}
          count={+commentCount - +prevCommentCount}
        />
      </React.Fragment>
    )
  }
}

export default CommentsNotification
