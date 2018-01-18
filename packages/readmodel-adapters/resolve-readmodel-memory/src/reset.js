import 'regenerator-runtime/runtime';

export default function reset(repository) {
    if (repository.disposePromise) {
        return repository.disposePromise;
    }

    const disposePromise = Promise.all(
        Array.from(repository.storagesMap.keys()).map(repository.writeInterface.drop.bind(null))
    );

    Object.keys(repository).forEach((key) => {
        delete repository[key];
    });

    repository.disposePromise = disposePromise;
    return disposePromise;
}
