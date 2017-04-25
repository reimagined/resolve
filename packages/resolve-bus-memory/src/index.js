export default function inMemoryBus() {
    const eventHandlersMap = new Map();
    return {
        onEvent: (eventTypesArray, callback) => {
            eventTypesArray.forEach((eventType) => {
                const callbackArray = eventHandlersMap.get(eventType) || [];
                callbackArray.push(callback);
                eventHandlersMap.set(eventType, callbackArray);
            });

            return () => {
                eventTypesArray.forEach((eventType) => {
                    const callbackArray = eventHandlersMap.get(eventType);
                    const callbackIndex = callbackArray.indexOf(callback);

                    if (callbackIndex >= 0) {
                        callbackArray.splice(callbackIndex, 1);
                    }
                });
            };
        },

        emitEvent: (event) => {
            const callbacks = eventHandlersMap.get(event.__type);
            if (callbacks) {
                callbacks.forEach(handler => handler(event));
            }
        }
    };
}
