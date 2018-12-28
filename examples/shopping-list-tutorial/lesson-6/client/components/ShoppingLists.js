import React from 'react'
import { ControlLabel, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'

class ShoppingLists extends React.PureComponent {
  render() {
    const { lists } = this.props

    return (
      <div>
        <ControlLabel>My shopping lists</ControlLabel>
        <Table responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Shopping List</th>
            </tr>
          </thead>
          <tbody>
            {lists.map(({ id, name }, index) => (
              <tr key={id}>
                <td>{index + 1}</td>
                <td>
                  <Link to={`/${id}`}>{name}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }
}

export default ShoppingLists
