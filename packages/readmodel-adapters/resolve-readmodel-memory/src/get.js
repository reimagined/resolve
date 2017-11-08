import hash from './hash';

export default function get(repository, onDemandOptions) {
    const key = hash(onDemandOptions);

    if (repository.has(key)) {
        return repository.get(key).readApi;
    }

    return null;
}
