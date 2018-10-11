import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'

import * as optimisticActions from '../actions/optimistic-actions'

const Container = styled.div`
  text-align: center;
  background-color: rgba(57, 73, 171, 0.75);
  margin-bottom: 10px;
  cursor: pointer;
`

const Notification = styled.div`
  display: inline-block;
  text-align: left;
  padding: 15px;
  color: #ffffff;
`

export class CommentCountUpdater extends React.PureComponent {
  componentDidMount() {
    this.props.updateCommentCount(this.props.commentCount)
  }

  render() {
    return null
  }
}

export const mapStateToOptions = (
  { optimistic: { refreshId }, jwt: { id: authorId } },
  { treeId, parentCommentId, timestamp }
) => ({
  readModelName: 'Comments',
  resolverName: 'foreignCommentsCount',
  resolverArgs: {
    refreshId,
    authorId,
    treeId,
    parentCommentId,
    timestamp
  }
})

export const mapStateToProps = (state, { data }) => ({
  commentCount: data
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(optimisticActions, dispatch)

export const CommentsConnector = connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CommentCountUpdater)
)

class CommentsNotification extends React.PureComponent {
  static defaultProps = {
    refreshInterval: 30 * 1000
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
    this.props.updateRefreshId()
    this.setState({
      commentCount: null,
      prevCommentCount: null
    })
  }

  render() {
    const notification =
      this.state.commentCount === this.state.prevCommentCount ? null : (
        <Container onClick={this.refresh}>
          <Notification>
            Comments had been updated - refresh page to see them
          </Notification>
        </Container>
      )

    return (
      <React.Fragment>
        {notification}
        <CommentsConnector
          {...this.props}
          timestamp={this.state.timestamp}
          updateCommentCount={this.updateCommentCount}
        />
      </React.Fragment>
    )
  }
}

export default connect(
  null,
  dispatch => bindActionCreators(optimisticActions, dispatch)
)(CommentsNotification)
