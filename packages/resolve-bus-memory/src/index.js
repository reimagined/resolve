function createDriver() {
    let handler = () => {};

    return {
        setTrigger: callback => (handler = callback),
        publish: event => handler(event)
    };
}

module.exports = createDriver;
export default createDriver;
