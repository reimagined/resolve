import React from 'react';
import TodoItem from './TodoItem';
import TodoTextInput from './TodoTextInput';

import './TaskList.css';

export default function (props) {
    return (
        <div className="todobody">
            <div className="todoapp">
                <h1 className="page-header">{props.title}</h1>
                <TodoTextInput newTodo onSave={() => {}} placeholder="What needs to be done?" />
                <ul className="todo-list">
                    {Object.keys(props.tasks).map(key => (
                        <TodoItem key={key} todo={props.tasks[key]} />
                    ))}
                </ul>
            </div>
        </div>
    );
}
