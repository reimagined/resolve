function createDriver() {
    let handler = () => {};

    return {
        setTrigger: callback => (handler = callback),
        publish: event => handler(event)
    };
}

export default createDriver;
