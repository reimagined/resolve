export default function (obj, beforeWarnings, afterWarnings) {
    const warningMessages = Object.keys(obj)
        .map(fieldName => (obj[fieldName] ? null : `The '${fieldName}' is required`))
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
