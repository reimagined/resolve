import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import { ListGroup, ListGroupItem, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

class UserLikes extends React.PureComponent {
  render() {
    const { isLoading, data } = this.props

    if (isLoading !== false) {
      return null
    }

    return (
      <div className="example-wrapper">
        <Link to="/users">users</Link>
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

const ConnectedLikes = connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(UserLikes)
)

class Wrapper extends React.PureComponent {
  state = {
    mounted: true,
  }

  mount = () => {
    this.setState({ mounted: true })
  }

  unmount = () => {
    this.setState({ mounted: false })
  }

  render() {
    const userId = this.props.match.params.id

    return (
      <div className="example-wrapper">
        <Button onClick={this.unmount}>unmount</Button>
        <Button onClick={this.mount}>mount</Button>
        {this.state.mounted ? <ConnectedLikes userId={userId} /> : null}
      </div>
    )
  }
}

export default Wrapper
