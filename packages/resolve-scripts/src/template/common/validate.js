const validate = {
    throwErrorIfAlreadyExists(state) {
        if (state) {
            throw new Error('The todo already exists');
        }
    },
    throwErrorIfCompleted(state) {
        if (state.completed) {
            throw new Error('The todo has already been completed');
        }
    },
    throwErrorIfNotCompleted(state) {
        if (!state.completed) {
            throw new Error('The todo has not been completed');
        }
    }
};

export default validate;
