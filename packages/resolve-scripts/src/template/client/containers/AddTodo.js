import React from 'react';
import uuid from 'uuid';
import { connect } from 'react-redux';
import actions from '../actions';

let AddTodo = ({ dispatch }) => {
    let input;

    return (
        <div>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!input.value.trim()) {
                        return;
                    }
                    dispatch(
                        actions.createTodo(uuid.v4(), {
                            text: input.value
                        })
                    );
                    input.value = '';
                }}
            >
                <input
                    ref={(node) => {
                        input = node;
                    }}
                />
                <button type="submit">
                    Add Todo
                </button>
            </form>
        </div>
    );
};
AddTodo = connect()(AddTodo);

export default AddTodo;
