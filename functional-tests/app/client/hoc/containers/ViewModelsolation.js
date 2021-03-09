import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel, sendAggregateAction } from '@resolve-js/redux'
import { Button } from 'react-bootstrap'

class Likes extends React.PureComponent {
  render() {
    const { isLoading, data, salt } = this.props

    const id = `likes${salt}`

    if (isLoading !== false) {
      return <h3>{`loading${salt}`}</h3>
    }

    return <h3 id={id}>{data.likes}</h3>
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
  connect(mapStateToProps, mapDispatchToProps)(Likes)
)
const ConnectedLikesB = connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(Likes)
)

class Wrapper extends React.Component {
  state = {
    mounted: true,
  }

  like = () => this.props.likeUser(this.props.match.params.id)
  register = () =>
    this.props.registerUser(this.props.match.params.id, 'John Smith')

  unmount = () => {
    if (this.state.mounted) {
      this.setState({ mounted: false })
    }
  }

  render() {
    const userId = this.props.match.params.id

    return (
      <div className="example-wrapper">
        <Button onClick={this.register}>Register</Button>
        <Button onClick={this.like}>Like</Button>
        <Button onClick={this.unmount}>Unmount</Button>
        <ConnectedLikesA userId={userId} salt="-1" />
        {this.state.mounted ? (
          <ConnectedLikesB userId={userId} salt="-2" />
        ) : null}
      </div>
    )
  }
}

const mapWrapperDispatchToProps = (dispatch) => ({
  likeUser: (userId) =>
    dispatch(sendAggregateAction('user', 'like', userId, {})),
  registerUser: (userId, name) =>
    dispatch(sendAggregateAction('user', 'register', userId, { name })),
})

export default connect(null, mapWrapperDispatchToProps)(Wrapper)
