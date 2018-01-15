import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import actions from './actions';

export default (mapStateToProps, mapDispatchToProps, mergeProps, options) => (Component) => {
    const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps, mergeProps, options)(
        Component
    );

    class WithViewModels extends React.PureComponent {
        constructor(props, context) {
            super(props, context);
            this.state = { isMounted: false };
        }

        componentWillMount() {
            const { viewModel, aggregateId } = this.props;

            this.context.store.dispatch(actions.subscribe(viewModel, aggregateId));
        }

        componentWillUnmount() {
            const { viewModel, aggregateId } = this.props;

            this.context.store.dispatch(actions.unsubscribe(viewModel, aggregateId));
        }

        render() {
            return <ConnectedComponent {...this.props} />;
        }
    }

    WithViewModels.contextTypes = {
        store: PropTypes.object.isRequired
    };

    return WithViewModels;
};
