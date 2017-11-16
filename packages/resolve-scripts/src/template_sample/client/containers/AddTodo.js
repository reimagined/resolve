import React from 'react';
import uuid from 'uuid';
import { connect } from 'react-redux';
import actions from '../actions';

import styled from 'styled-components';

const FormContent = styled.div`
    padding: 8px 16px;
`;

let AddTodo = ({ dispatch }) => {
    let input;

    return (
        <FormContent>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!input.value.trim()) {
                        return;
                    }
                    dispatch(
                        actions.createTodo('root-id', {
                            todoId: uuid.v4(),
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
                <button type="submit">Add Todo</button>
            </form>
        </FormContent>
    );
};
AddTodo = connect()(AddTodo);

export default AddTodo;
