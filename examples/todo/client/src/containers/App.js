import { connect } from "react-redux";

import App from "../components/App";

const mapStateToProps = (state) => ({
    cards: state.cards
});

export default connect(mapStateToProps)(App);
