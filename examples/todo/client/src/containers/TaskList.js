import { connect } from 'react-redux';

import TaskList from '../components/TaskList';

export default connect(state => ({
    navigation: state.navigation
}))(TaskList);
