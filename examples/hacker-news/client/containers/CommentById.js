import React from 'react'
import { bindActionCreators } from 'redux'
import uuid from 'uuid'
import { connectReadModel, connectViewModel } from 'resolve-redux'
import styled from 'styled-components'

import viewModel from '../../common/view-models/storyDetails'
import actions from '../actions/storiesActions'
import Comment from '../components/Comment'
import ChildrenComments from '../components/ChildrenComments'

const Reply = styled.div`
  padding: 1em 1.25em 0 1.25em;
  margin-bottom: 1em;
`

export class CommentById extends React.PureComponent {
  saveComment = () => {
    const { parentId, aggregateId } = this.props

    this.props.commentStory({
      aggregateId,
      parentId,
      text: this.textarea.value
    })

    this.textarea.value = ''
  }

  render() {
    const {
      data: { me },
      story,
      parentId
    } = this.props
    const loggedIn = !!me

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

export const mapStateToProps = (
  state,
  {
    match: {
      params: { storyId, commentId }
    }
  }
) => ({
  story: state.viewModels[viewModel.name][storyId],
  viewModelName: viewModel.name,
  aggregateId: storyId,
  parentId: commentId
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      commentStory: ({ aggregateId, parentId, text }) =>
        actions.commentStory(aggregateId, {
          text,
          parentId,
          commentId: uuid.v4()
        })
    },
    dispatch
  )

const getReadModelData = state => {
  try {
    return { me: state.readModels['default']['user'] }
  } catch (err) {
    return { me: null }
  }
}

export default connectReadModel(state => ({
  readModelName: 'default',
  resolverName: 'user',
  parameters: {},
  data: getReadModelData(state)
}))(connectViewModel(mapStateToProps, mapDispatchToProps)(CommentById))
