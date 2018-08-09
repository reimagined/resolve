import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { Button, Table } from 'react-bootstrap'

class FindUsers extends React.PureComponent {
  render() {
    const {
      data,
      optimisticAddedSharings,
      optimisticRemovedSharings,
      options: { query },
      buttonText,
      buttonBaseStyle,
      onPressButton
    } = this.props

    const addedSharingIds = optimisticAddedSharings.map(({ id }) => id)
    const removedSharingIds = optimisticRemovedSharings.map(({ id }) => id)
    let users = [
      ...data.filter(({ id }) => !addedSharingIds.includes(id)),
      ...optimisticAddedSharings
    ].filter(({ id }) => !removedSharingIds.includes(id))
    if (query) {
      users = users.filter(({ username }) => username.includes('query'))
    }

    if (users.length === 0) {
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
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(({ id, username }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>{username}</td>
              <td className="example-table-action">
                <Button
                  className="example-button"
                  bsStyle={buttonBaseStyle}
                  onClick={onPressButton.bind(null, id, username)}
                >
                  {buttonText}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    )
  }
}

export const mapStateToOptions = (state, { options }) => ({
  readModelName: 'Default',
  resolverName: 'users',
  resolverArgs: options
})

export default connectReadModel(mapStateToOptions)(FindUsers)
