import React, { Component } from 'react';
import classnames from 'classnames';

export default class TodoItem extends Component {
    constructor(props) {
        super(props);
        this.state = { editing: false };
        //     this._handleSave = (text) => {
        //         if (text.length === 0) {
        //             this.props.deleteTodo({ key: this.props.todo.key });
        //         } else {
        //             this.props.editTodo({ key: this.props.todo.key, text });
        //         }
        //         this.setState({ editing: false });
        //     };
        //     this._handleComplete = () => this.props.completeTodo({ key: this.props.todo.key });
        //     this._handleDelete = () => this.props.deleteTodo({ key: this.props.todo.key });
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
