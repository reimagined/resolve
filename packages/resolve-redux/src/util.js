export function checkRequiredFields(obj, beforeWarnings, afterWarnings) {
    const warningMessages = Object.keys(obj)
        .map(fieldName => (obj[fieldName] ? null : `The '${fieldName}' field is required`))
        .filter(msg => msg);

    const shouldWarningsBePrinted = warningMessages.length > 0;

    if (shouldWarningsBePrinted) {
        // eslint-disable-next-line no-console
        console.warn(
            [beforeWarnings, ...warningMessages, afterWarnings].filter(line => line).join('\n')
        );
    }

    return !shouldWarningsBePrinted;
}

export function getRootableUrl(path) {
    const rootDir = typeof process !== 'undefined' &&
        typeof process.env !== 'undefined' &&
        process.env.ROOT_DIR
        ? process.env.ROOT_DIR
        : '';

    return `${rootDir}${path}`;
}
