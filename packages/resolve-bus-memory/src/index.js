export default function inMemoryBus() {
    const eventHandlersMap = new Map();
    return {
        emitEvent: (event) => {
            const callbacks = eventHandlersMap.get(event.__type);
            if (callbacks) {
                callbacks.forEach(handler => handler(event));
            }
        },
        onEvent: (eventTypesArray, callback) => {
            eventTypesArray.forEach((eventType) => {
                const callbackArray = eventHandlersMap.get(eventType) || [];
                callbackArray.push(callback);
                eventHandlersMap.set(eventType, callbackArray);
            });

            return () => {
                eventTypesArray.forEach((eventType) => {
                    const callbackArray = eventHandlersMap.get(eventType);
                    eventHandlersMap.set(eventType, callbackArray
                        .filter(item => item !== callback));
                });
            };
        }
    };
}
