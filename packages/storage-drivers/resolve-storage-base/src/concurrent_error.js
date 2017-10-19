function ConcurrentError() {
    Error.call(this);
    this.name = 'ConcurrentError';

    this.message = 'Concurrent error';

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ConcurrentError);
    } else {
        this.stack = new Error().stack;
    }
}

ConcurrentError.prototype = Object.create(Error.prototype);

export default ConcurrentError;
