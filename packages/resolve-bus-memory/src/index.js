export default function inMemoryBus() {
    const callbacks = [];

    return {
        subscribe: (callback) => {
            callbacks.push(callback);

            return () => {
                const callbackIndex = callbacks.indexOf(callback);

                if (callbackIndex >= 0) {
                    callbacks.splice(callbackIndex, 1);
                }
            };
        },

        publish: (event) => {
            callbacks.forEach(handler => handler(event));
        }
    };
}
