export default function ({ driver }) {
    return {
        emitEvent: event => driver.emitEvent(event),
        onEvent: (eventTypes, handler) => driver.onEvent(eventTypes, handler)
    };
}
