import React from 'react'
import { bindActionCreators } from 'redux'
import { connectViewModel } from 'resolve-redux'
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

class CommentsNotification extends React.PureComponent {
  state = {
    shown: false
  }

  showNotification = () => {
    this.setState({
      shown: true
    })
  }

  componentDidUpdate() {
    if (this.props.shown) {
      this.setState({
        shown: true
      })
    }
  }

  render() {
    const { updateRefreshId } = this.props

    if (!this.state.shown) {
      return null
    }

    return (
      <Container onClick={updateRefreshId}>
        <Notification>
          Comments had been updated - refresh page to see them
        </Notification>
      </Container>
    )
  }
}

const mapStateToOptions = ({ optimistic: { refreshId } }, { treeId }) => ({
  viewModelName: 'CommentsNotification',
  aggregateIds: [treeId],
  aggregateArgs: {
    refreshId
  }
})

const mapStateToProps = (state, props) => ({
  shown: state.jwt && state.jwt.id !== props.data.userId
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(optimisticActions, dispatch)

export default connectViewModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CommentsNotification)
)
