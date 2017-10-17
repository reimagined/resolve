export function getSourceInfo(userObject) {
    try {
        const sourcedecl = userObject.__SOURCE_DELCARATION__;
        const { sourceCode, filename, startLine, startColumn, endLine, endColumn } = sourcedecl;
        return `in ${filename} line ${startLine}:${startColumn} / ${endLine}:${endColumn}
            """${sourceCode}"""`;
    } catch (err) {
        return '(Source information unavailable)';
    }
}

export function raiseError(errorText) {
    // eslint-disable-next-line no-console
    console.error('Error: ', errorText);
    process.exit(1);
}
