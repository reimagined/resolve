import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { NavLink } from 'react-router-dom';
import { withViewModel } from 'resolve-redux';

import actions from '../actions';

const viewModel = 'Todos';

const Todo = ({ todos, createItem, toggleItem, removeItem, aggregateId }) => {
    let newTodo;
    return (
        <div>
            <h1>
                <NavLink to="/">Home</NavLink> | TODO
            </h1>
            <ol>
                {Object.keys(todos).map(id => (
                    <li key={id}>
                        <label>
                            <input
                                type="checkbox"
                                checked={todos[id].checked}
                                onChange={toggleItem.bind(null, aggregateId, { id })}
                            />
                            {todos[id].text}
                        </label>
                        <span onClick={removeItem.bind(null, aggregateId, { id })}>{' [x]'}</span>
                    </li>
                ))}
            </ol>
            <input type='text' ref={element => (newTodo = element)} />
            <button
                onClick={() => {
                    createItem(aggregateId, {
                        text: newTodo.value,
                        id: Date.now()
                    });
                    newTodo.value = '';
                }}
            >
                Add Item
            </button>
        </div>
    );
};

const mapStateToProps = (state, ownProps) => {
    const aggregateId = ownProps.match.params.id;

    return {
        viewModel,
        aggregateId,
        todos: state[viewModel][aggregateId]
    };
};

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withViewModel(Todo));
