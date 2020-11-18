import React from 'react'
import { FormCheck } from 'react-bootstrap'

import Image from '../containers/Image'

class Todo extends React.PureComponent {
  render() {
    const { checked, text, removeItem, toggleItem } = this.props

    return (
      <div className="shopping-item">
        <FormCheck inline checked={checked} onChange={toggleItem}>
          {text}
        </FormCheck>
        <Image
          className="example-close-button"
          src="/close-button.png"
          onClick={removeItem}
        />
      </div>
    )
  }
}

export default Todo
