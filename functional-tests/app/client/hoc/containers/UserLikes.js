import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { ListGroup, ListGroupItem } from 'react-bootstrap'

class UserLikes extends React.PureComponent {
  render() {
    const { isLoading, data } = this.props

    if (isLoading !== false) {
      return null
    }

    return (
      <div className="example-wrapper">
        <ListGroup className="example-list">
          {Object.keys(data).map((userId) => (
            <ListGroupItem key={userId}>
              {`${userId}:${data[userId]}`}
            </ListGroupItem>
          ))}
        </ListGroup>
      </div>
    )
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
  connect(mapStateToProps, mapDispatchToProps)(UserLikes)
)
const ConnectedLikesB = connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(UserLikes)
)

class Wrapper extends React.PureComponent {
  render() {
    const userId = this.props.match.params.id

    return (
      <div className="example-wrapper">
        <ConnectedLikesA userId={userId} />
        <ConnectedLikesB userId={userId} />
      </div>
    )
  }
}

export default Wrapper
