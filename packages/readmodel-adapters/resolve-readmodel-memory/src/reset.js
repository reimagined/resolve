import hash from './hash'

export default function reset(repository, onDemandOptions) {
    const key = hash(onDemandOptions);

    if (repository.has(key)) {
        repository.get(key).onDestroy();
        repository.delete(key);
    }
};