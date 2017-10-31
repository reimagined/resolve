function ConcurrentError() {
    Error.call(this);
    this.name = 'ConcurrentError';

    this.message = 'Concurrency error';

    if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ConcurrentError);
    } else {
        this.stack = new Error().stack;
    }
}

ConcurrentError.prototype = Object.create(Error.prototype);

export default ConcurrentError;
