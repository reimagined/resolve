import 'regenerator-runtime/runtime';

export default function reset(repository) {
    if (repository.disposePromise) {
        return repository.disposePromise;
    }

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = Promise.resolve();
    return repository.disposePromise;
}
