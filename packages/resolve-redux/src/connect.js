import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import isLoadingViewModel from './is_loading_view_model';

import actions from './actions';

export default (mapStateToProps, mapDispatchToProps, mergeProps, options) => (Component) => {
    const ConnectedComponent = connect(mapStateToProps, mapDispatchToProps, mergeProps, options)(
        Component
    );

    class WithViewModels extends React.PureComponent {
        componentWillMount() {
            const { viewModelName, aggregateId } = mapStateToProps(
                this.context.store.getState(),
                this.props
            );

            this.context.store.dispatch(actions.subscribe(viewModelName, aggregateId));
        }

        componentWillUnmount() {
            const { viewModelName, aggregateId } = this.props;

            this.context.store.dispatch(actions.unsubscribe(viewModelName, aggregateId));
        }

        render() {
            const { viewModelName, aggregateId } = this.props;

            const loading = isLoadingViewModel(this.context.store, viewModelName, aggregateId);

            return <ConnectedComponent {...this.props} loading={loading} />;
        }
    }

    WithViewModels.contextTypes = {
        store: PropTypes.object.isRequired
    };

    return WithViewModels;
};
