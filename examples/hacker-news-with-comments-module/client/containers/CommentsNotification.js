import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import styled from 'styled-components'
import { CommentsNotification } from 'resolve-module-comments'

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

class TemplateCommentsNotification extends React.PureComponent {
  render() {
    return (
      <CommentsNotification>
        {({ count }) =>
          count !== 0 ? (
            <Container onClick={this.refresh}>
              <Notification>
                Comments had been updated - refresh page to see them
              </Notification>
            </Container>
          ) : null
        }
      </CommentsNotification>
    )
  }
}

export default connect(dispatch =>
  bindActionCreators(optimisticActions, dispatch)
)(TemplateCommentsNotification)
