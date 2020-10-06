import React from 'react'
import { connect } from 'react-redux'
import { connectViewModel } from 'resolve-redux'
import {
  ListGroup,
  ListGroupItem
} from 'react-bootstrap'

export class UsersLikes extends React.PureComponent {
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

export const mapStateToOptions = () => {
  return {
    viewModelName: 'cumulative-likes',
    aggregateIds: [],
    aggregateArgs: {},
  }
}

export const mapStateToProps = () => ({})
export const mapDispatchToProps = () => ({})

export default connectViewModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(UsersLikes)
)
