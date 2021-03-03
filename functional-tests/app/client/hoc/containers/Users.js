import React from 'react'
import { connectReadModel } from '@resolve-js/redux'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'

class Users extends React.PureComponent {
  render() {
    const { users } = this.props

    if (!users) {
      return null
    }

    return (
      <div className="example-wrapper">
        {users.map(({ id }) => (
          <div key={id}>
            <Button
              href={`users-likes/${id}`}
              key={id}
            >{`likes of ${id}`}</Button>
            <br />
          </div>
        ))}
      </div>
    )
  }
}

export const mapStateToOptions = () => ({
  readModelName: 'users',
  resolverName: 'all',
  resolverArgs: {},
})

export const mapStateToProps = (state, { data, isLoading }) => {
  return {
    isLoading,
    users: data,
  }
}

export const mapDispatchToProps = () => ({})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps, mapDispatchToProps)(Users)
)
