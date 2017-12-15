import React from 'react';
import PropTypes from 'prop-types';
import Todo from './Todo';

const TodoList = ({ todos, completeTodo, resetTodo }) => (
    <ul>
        {todos.map(todo => (
            <Todo
                key={todo.todoId}
                {...todo}
                onClick={() =>
                    todo.completed
                        ? resetTodo('root-id', { todoId: todo.todoId })
                        : completeTodo('root-id', { todoId: todo.todoId })}
            />
        ))}
    </ul>
);

TodoList.propTypes = {
    todos: PropTypes.arrayOf(
        PropTypes.shape({
            todoId: PropTypes.string.isRequired,
            completed: PropTypes.bool.isRequired,
            text: PropTypes.string.isRequired
        }).isRequired
    ).isRequired,
    completeTodo: PropTypes.func.isRequired,
    resetTodo: PropTypes.func.isRequired
};

export default TodoList;
