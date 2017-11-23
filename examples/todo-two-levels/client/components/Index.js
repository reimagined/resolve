import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { NavLink } from 'react-router-dom';
import { withViewModels } from 'resolve-redux';

import actions from '../actions';

const viewModel = 'Index';

const Index = ({ lists, createList }) => {
    let newList;
    return (
        <div>
            <h1>Two level TODO list</h1>
            <ol>
                {lists.map(({ id, title }) => (
                    <li key={id}>
                        <NavLink to={`/${id}`}>{title}</NavLink>
                    </li>
                ))}
            </ol>
            <input ref={element => (newList = element)} />
            <button
                onClick={() => {
                    createList(Date.now(), {
                        title: newList.value
                    });
                    newList.value = '';
                }}
            >
                Add List
            </button>
        </div>
    );
};

const mapStateToProps = (state) => {
    const aggregateId = '*';

    return {
        viewModel,
        aggregateId,
        lists: state[viewModel][aggregateId]
    };
};

const mapDispatchToProps = dispatch => bindActionCreators(actions, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(withViewModels(Index));
