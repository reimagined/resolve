import React from 'react'
import { FormLabel, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const ShoppingLists = ({ lists }) => {
  return (
    <div>
      <FormLabel>My shopping lists</FormLabel>
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

export default ShoppingLists