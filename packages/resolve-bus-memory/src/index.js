export default function() {
    let handler = () => {};

    return {
        setTrigger: callback => (handler = callback),
        publish: event => handler(event)
    };
}
