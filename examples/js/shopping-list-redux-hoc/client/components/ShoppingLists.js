import React from 'react'
import { Button, FormLabel, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
class ShoppingLists extends React.PureComponent {
  render() {
    const { lists } = this.props
    return (
      <div>
        <FormLabel>My shopping lists</FormLabel>
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
              <tr key={id}>
                <td>{index + 1}</td>
                <td>
                  <Link to={`/${id}`}>{name}</Link>
                </td>
                <td className="example-table-action">
                  <Button
                    variant="danger"
                    onClick={() => {
                      this.props.removeShoppingList(id)
                    }}
                  >
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
