import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel, sendAggregateAction } from '@resolve-js/redux'
import { Button } from 'react-bootstrap'

class OneViewModelMountedTwice extends React.PureComponent {
  render() {
    const { isLoading, data, salt } = this.props

    if (isLoading !== false) {
      return null
    }

    return <h3>{`likes${salt}:${data.likes}`}</h3>
  }
}

const mapStateToOptions = (state, ownProps) => {
  const aggregateId = ownProps.userId

  return {
    viewModelName: 'cumulative-likes',
    aggregateIds: [aggregateId],
    aggregateArgs: {},
  }
}

const mapStateToProps = () => ({})
const mapDispatchToProps = () => ({})

const ConnectedLikesA = connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(OneViewModelMountedTwice)
)
const ConnectedLikesB = connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(OneViewModelMountedTwice)
)

class Wrapper extends React.PureComponent {
  like = () => this.props.likeUser(this.props.match.params.id)

  render() {
    const userId = this.props.match.params.id

    return (
      <div className="example-wrapper">
        <Button onClick={this.like}>like</Button>
        <ConnectedLikesA userId={userId} salt="#1" />
        <ConnectedLikesB userId={userId} salt="#2" />
      </div>
    )
  }
}

const mapWrapperDispatchToProps = (dispatch) => ({
  likeUser: (userId) =>
    dispatch(sendAggregateAction('user', 'like', userId, {})),
})

export default connect(() => ({}), mapWrapperDispatchToProps)(Wrapper)
