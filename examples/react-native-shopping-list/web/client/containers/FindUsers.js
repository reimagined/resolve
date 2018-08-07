import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { Button, Table } from 'react-bootstrap'

class FindUsers extends React.PureComponent {
  render() {
    const { data, onShareForUser } = this.props

    if (data.length === 0) {
      return (
        <div>
          Users not found
          <br />
          <br />
        </div>
      )
    }

    return (
      <Table responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Username</th>
            <th style={{ width: '1px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ id, username }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>{username}</td>
              <td>
                <Button
                  bsStyle="success"
                  onClick={onShareForUser.bind(null, id)}
                >
                  Share
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }
}

export const mapStateToOptions = (state, { query }) => ({
  readModelName: 'Default',
  resolverName: 'users',
  resolverArgs: { query }
})

export default connectReadModel(mapStateToOptions)(FindUsers)
