module.exports = (message, name) => {
    const error = new Error(String(message));
    if (typeof name !== 'undefined') {
        error.name = String(name);
    }

    delete error.description;
    delete error.stack;
    return error;
};
