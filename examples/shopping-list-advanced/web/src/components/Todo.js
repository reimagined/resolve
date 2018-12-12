import React from 'react'
import { Checkbox } from 'react-bootstrap'

import Image from '../containers/Image'

class Todo extends React.PureComponent {
  render() {
    const { checked, text, removeItem, toggleItem } = this.props

    return (
      <div className="shopping-item">
        <Checkbox inline checked={checked} onChange={toggleItem}>
          {text}
        </Checkbox>
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
