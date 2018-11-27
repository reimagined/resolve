import React from 'react'
import { Button, ControlLabel, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'

class ShoppingLists extends React.PureComponent {
  render() {
    const { lists, removeShoppingList } = this.props

    return (
      <div>
        <ControlLabel>My shopping lists:</ControlLabel>
        <Table responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Shopping List</th>
              <th className="example-table-action">Action</th>
            </tr>
          </thead>
          <tbody>
            {lists.map(({ id, name }, index) => (
              <tr key={id} className="shopping-list">
                <td>{index + 1}</td>
                <td>
                  <Link to={`/${id}`}>{name}</Link>
                </td>
                <td className="example-table-action">
                  <Button href={`/share/${id}`}>
                    <i className="fas fa-share-alt" />
                  </Button>{' '}
                  <Button onClick={removeShoppingList.bind(null, id, {})}>
                    <i className="far fa-trash-alt" />
                  </Button>
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
