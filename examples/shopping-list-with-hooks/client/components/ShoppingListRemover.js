import React from 'react';
import { Button } from 'react-bootstrap';
import { useCommand } from 'resolve-react-hooks';

const ShoppingListRemover = ({ shoppingListId, onRemoveSuccess }) => {
  const removeShoppingListCommand = useCommand(
    {
      type: 'removeShoppingList',
      aggregateId: shoppingListId,
      aggregateName: 'ShoppingList',
    },
    onRemoveSuccess
  );

  return (
    <Button onClick={removeShoppingListCommand}>
      <i className="far fa-trash-alt" />
    </Button>
  );
};

export default ShoppingListRemover;
