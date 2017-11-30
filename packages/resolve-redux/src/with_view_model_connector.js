import React from 'react';
import PropTypes from 'prop-types';

import actions from './actions';

export default (Component) => {
    class WithViewModels extends React.PureComponent {
        constructor(props, context) {
            super(props, context);
            this.state = { isMounted: false };
        }

        componentWillMount() {
            const { viewModel, aggregateId } = this.props;

            this.context.store.dispatch(actions.subscribe(viewModel, aggregateId));
        }

        componentDidMount() {
            this.setState({ isMounted: true });
        }

        componentWillUnmount() {
            const { viewModel, aggregateId } = this.props;

            this.setState({ isMounted: false });

            this.context.store.dispatch(actions.unsubscribe(viewModel, aggregateId));
        }

        render() {
            if (!this.state.isMounted) {
                return null;
            }
            return <Component {...this.props} />;
        }
    }

    WithViewModels.contextTypes = {
        store: PropTypes.object.isRequired
    };

    return WithViewModels;
};
