import React, { Component } from 'react';
import classnames from 'classnames';

export default class TodoItem extends Component {
    constructor(props) {
        super(props);
        this.state = { editing: false };
    }

    render() {
        const { todo } = this.props;

        return (
            <li
                className={classnames({
                    completed: todo.completed,
                    editing: this.state.editing
                })}
            >
                <div className="view">
                    <input
                        className="toggle"
                        type="checkbox"
                        checked={todo.checked}
                        onChange={this._handleComplete}
                    />
                    <label htmlFor="itemContext">
                        {todo.name}
                    </label>
                    <button className="destroy" onClick={this._handleDelete} />
                </div>
            </li>
        );
    }
}
