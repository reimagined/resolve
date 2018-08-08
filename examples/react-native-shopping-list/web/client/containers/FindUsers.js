import React from 'react'
import { connectReadModel } from 'resolve-redux'
import { Button, Table } from 'react-bootstrap'

class FindUsers extends React.PureComponent {
  render() {
    const {
      data,
      optimisticAddedSharings,
      optimisticRemovedSharings,
      buttonText,
      buttonBaseStyle,
      onPressButton
    } = this.props
    
    const removedSharingIds = optimisticRemovedSharings.map(({ id }) => id)
    const users = [...data, ...optimisticAddedSharings].filter(
      ({ id }) => !removedSharingIds.includes(id)
    )

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
            <th style={{ width: '1px' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map(({ id, username }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>{username}</td>
              <td>
                <Button
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
