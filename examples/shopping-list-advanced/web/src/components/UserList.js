import React from 'react'
import { Button, Table } from 'react-bootstrap'

class UserList extends React.PureComponent {
  render() {
    const { users, buttonText, buttonBaseStyle, onPressButton } = this.props

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

export default UserList
