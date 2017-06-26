import React from 'react';
import { Redirect } from 'react-router-dom';
import TodoItem from './TodoItem';
import TodoTextInput from './TodoTextInput';

import './TaskList.css';

export default function (props) {
    if (!props.doesExist) {
        return <Redirect to="/" />;
    }

    return (
        <div className="todobody">
            <div className="todoapp">
                <h1 className="page-header">{props.title}</h1>
                {props.cardId &&
                    <TodoTextInput
                        newTodo
                        onSave={name => props.onTodoItemCreate(name, props.cardId)}
                        placeholder="What needs to be done?"
                    />}
                <ul className="todo-list">
                    {Object.keys(props.tasks).map(key =>
                        <TodoItem
                            key={key}
                            todo={props.tasks[key]}
                            onCheck={() => props.onTodoItemToggleCheck(key)}
                            onRemove={() => props.onTodoItemRemove(key)}
                        />
                    )}
                </ul>
            </div>
        </div>
    );
}
