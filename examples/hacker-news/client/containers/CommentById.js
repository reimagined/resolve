import React from 'react'
import { bindActionCreators } from 'redux'
import { connectViewModel } from 'resolve-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'
import uuid from 'uuid'

import Comment from '../components/Comment'
import ChildrenComments from '../components/ChildrenComments'

const Reply = styled.div`
  padding: 1em 1.25em 0 1.25em;
  margin-bottom: 1em;
`

export class CommentById extends React.PureComponent {
  saveComment = () => {
    const { parentId, story } = this.props

    this.props.commentStory({
      aggregateId: story.id,
      parentId,
      text: this.textarea.value
    })

    this.textarea.value = ''
  }

  render() {
    const { me, story, parentId } = this.props

    const loggedIn = !!me.id

    if (!story || !story.comments) {
      return null
    }

    return (
      <Comment
        storyId={story.id}
        {...story.comments.find(({ id }) => id === parentId)}
      >
        {loggedIn ? (
          <Reply>
            <textarea
              ref={element => (this.textarea = element)}
              name="text"
              rows="6"
              cols="70"
            />
            <div>
              <button onClick={this.saveComment}>reply</button>
            </div>
          </Reply>
        ) : null}
        <ChildrenComments
          storyId={story.id}
          comments={story.comments}
          parentId={parentId}
          loggedIn={loggedIn}
        />
      </Comment>
    )
  }
}

export const mapStateToOptions = (
  state,
  {
    match: {
      params: { storyId, commentId }
    }
  }
) => ({
  viewModelName: 'storyDetails',
  aggregateIds: [storyId],
  aggregateArgs: {
    page: 'CommentById',
    storyId,
    commentId
  }
})

export const mapStateToProps = (
  state,
  {
    match: {
      params: { commentId }
    },
    data
  }
) => ({
  story: data,
  parentId: commentId,
  me: state.jwt
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      commentStory: ({ aggregateId, parentId, text }) =>
        aggregateActions.commentStory(aggregateId, {
          text,
          parentId,
          commentId: uuid.v4()
        })
    },
    dispatch
  )

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CommentById)
)
