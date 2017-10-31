import React from 'react';
import classnames from 'classnames';

export default function TodoItem(props) {
    const { todo } = props;

    return (
        <li
            className={classnames({
                completed: todo.completed
            })}
        >
            <div className="view">
                <input
                    className="toggle"
                    type="checkbox"
                    checked={todo.checked}
                    onChange={props.onCheck}
                />
                <label htmlFor="itemContext">{todo.name}</label>
                <button className="destroy" onClick={props.onRemove} />
            </div>
        </li>
    );
}
