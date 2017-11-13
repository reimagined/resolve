import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const SelectedFilter = styled.span`
    background: #ddd;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 2px 6px;
    color: #777;
    margin: 0 2px;
`;

const Filter = styled.a`
    text-decoration: none;
    color: #333;
    border: 1px solid #ccc;
    padding: 2px 6px;
    border-radius: 4px;
    margin: 0 2px;
`;

const Link = ({ active, children, onClick }) => {
    if (active) {
        return <SelectedFilter>{children}</SelectedFilter>;
    }

    return (
        // eslint-disable-next-line
        <Filter
            href="#"
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
        >
            {children}
        </Filter>
    );
};

Link.propTypes = {
    active: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func.isRequired
};

export default Link;
