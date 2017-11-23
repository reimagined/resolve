import React from 'react';
import PropTypes from 'prop-types';

import actions from './actions';

export default (Component) => {
    class WithViewModels extends React.PureComponent {
        componentWillMount() {
            const { viewModel, aggregateId } = this.props;

            this.context.store.dispatch(actions.subscribe(viewModel, aggregateId));
        }

        componentWillUnmount() {
            const { viewModel, aggregateId } = this.props;

            this.context.store.dispatch(actions.unsubscribe(viewModel, aggregateId));
        }

        render() {
            return <Component {...this.props} />;
        }
    }

    WithViewModels.contextTypes = {
        store: PropTypes.object.isRequired
    };

    return WithViewModels;
};
