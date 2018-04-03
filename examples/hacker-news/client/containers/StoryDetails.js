import React from 'react'
import { bindActionCreators } from 'redux'
import uuid from 'uuid'
import { connectReadModel, connectViewModel } from 'resolve-redux'
import styled from 'styled-components'

import viewModel from '../../common/view-models/storyDetails'
import Story from '../containers/Story'
import actions from '../actions/storiesActions'
import ChildrenComments from '../components/ChildrenComments'

const StoryDetailsRoot = styled.div`
  padding: 1em 1.25em 0 1.75em;
  margin-bottom: 1em;
`

const Reply = styled.div`
  padding: 1em 1.25em 0 1.25em;
  margin-bottom: 1em;
`

export class StoryDetails extends React.PureComponent {
  saveComment = () => {
    this.props.commentStory({
      text: this.textarea.value,
      parentId: this.props.story.id
    })

    this.textarea.value = ''
  }

  render() {
    const { data: { me }, story } = this.props
    const loggedIn = !!me

    if (!story) {
      return null
    }

    return (
      <StoryDetailsRoot>
        <Story showText story={story} userId={me && me.id} />
        {loggedIn ? (
          <Reply>
            <textarea
              ref={element => (this.textarea = element)}
              name="text"
              rows="6"
              cols="70"
            />
            <div>
              <button onClick={this.saveComment}>add comment</button>
            </div>
          </Reply>
        ) : null}
        <ChildrenComments
          storyId={story.id}
          comments={story.comments}
          parentId={story.id}
          loggedIn={loggedIn}
        />
      </StoryDetailsRoot>
    )
  }
}

export const mapStateToProps = (state, { match: { params: { storyId } } }) => ({
  story: state.viewModels[viewModel.name][storyId],
  viewModelName: viewModel.name,
  aggregateId: storyId
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      commentStory: ({ parentId, text }) =>
        actions.commentStory(parentId, {
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
  variables: {},
  data: getReadModelData(state)
}))(connectViewModel(mapStateToProps, mapDispatchToProps)(StoryDetails))
