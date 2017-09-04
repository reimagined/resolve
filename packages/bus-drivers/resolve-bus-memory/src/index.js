function createDriver() {
    let handler = () => {};

    return {
        subscribe: callback => (handler = callback),
        publish: event => handler(event)
    };
}

export default createDriver;
