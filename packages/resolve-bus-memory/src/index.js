export default function () {
    let handler = () => {};

    return {
        subscribe: callback => (handler = callback),
        publish: event => handler(event)
    };
}
