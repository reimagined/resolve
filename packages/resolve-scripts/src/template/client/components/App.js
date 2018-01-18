import React from 'react';
import { Component, Styles, View, Text } from 'reactxp';

const styles = {
    container: Styles.createViewStyle({
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center'
    }),
    header: Styles.createTextStyle({
        fontSize: 32,
        marginBottom: 12
    })
};

class RootComponent extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Text style={styles.header}>Hello world!</Text>
            </View>
        );
    }
}

export default RootComponent;
