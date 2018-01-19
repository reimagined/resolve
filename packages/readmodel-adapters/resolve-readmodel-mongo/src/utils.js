export function performMongoOperation(resource, operationName, ...inputArgs) {
    return new Promise((resolve, reject) =>
        resource[operationName](
            ...inputArgs,
            (err, result) => (!err ? resolve(result) : reject(err))
        )
    );
}
