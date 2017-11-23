import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withViewModels } from 'resolve-redux';

import actions from '../actions';

const viewModel = 'Todos';
const aggregateId = 'root-id';

const App = ({ todos, createTodo, toggleTodo, removeTodo, aggregateId }) => {
    let newTodo;
    return (
        <div>
            <h1>TODO</h1>
            <ol>
                {Object.keys(todos).map(id => (
                    <li key={id}>
                        <label>
                            <input
                                type="checkbox"
                                checked={todos[id].checked}
                                onChange={toggleTodo.bind(null, aggregateId, { id })}
                            />
                            {todos[id].text}
                        </label>
                        <span onClick={removeTodo.bind(null, aggregateId, { id })}>{' [x]'}</span>
                    </li>
                ))}
            </ol>
            <input ref={element => (newTodo = element)} />
            <button
                onClick={() => {
                    createTodo(aggregateId, {
                        text: newTodo.value,
                        id: Date.now()
                    });
                    newTodo.value = '';
                }}
            >
                Add Todo
            </button>
        </div>
    );
};

const mapStateToProps = state => ({
    viewModel,
    aggregateId,
    todos: state[viewModel][aggregateId]
});

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withViewModels(App));
