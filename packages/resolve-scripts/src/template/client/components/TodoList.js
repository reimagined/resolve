import React from 'react';
import PropTypes from 'prop-types';
import Todo from './Todo';

const TodoList = ({ todos, completeTodo, resetTodo }) => (
    <ul>
        {todos.map(todo => (
            <Todo
                key={todo.aggregateId}
                {...todo}
                onClick={() =>
                    todo.completed ? resetTodo(todo.aggregateId) : completeTodo(todo.aggregateId)}
            />
        ))}
    </ul>
);

TodoList.propTypes = {
    todos: PropTypes.arrayOf(
        PropTypes.shape({
            aggregateId: PropTypes.string.isRequired,
            completed: PropTypes.bool.isRequired,
            text: PropTypes.string.isRequired
        }).isRequired
    ).isRequired,
    completeTodo: PropTypes.func.isRequired,
    resetTodo: PropTypes.func.isRequired
};

export default TodoList;
