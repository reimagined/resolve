import React from 'react'
import { ControlLabel, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'

import ShoppingListRemover from './ShoppingListRemover'

const ShoppingLists = ({ lists, onRemoveSuccess }) => {
  return (
    <div>
      <ControlLabel>My shopping lists</ControlLabel>
      <Table responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Shopping List</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {lists.map(({ id, name }, index) => (
            <tr key={id}>
              <td>{index + 1}</td>
              <td>
                <Link to={`/${id}`}>{name}</Link>
              </td>
              <td>
                <ShoppingListRemover
                  shoppingListId={id}
                  onRemoveSuccess={onRemoveSuccess}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default ShoppingLists