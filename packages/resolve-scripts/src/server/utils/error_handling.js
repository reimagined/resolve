export function getSourceInfo(userObject) {
    try {
        const sourcedecl = userObject.__SOURCE_DELCARATION__;
        const { filename, startLine, startColumn, endLine, endColumn } = sourcedecl;
        const result = `in ${filename} line ${startLine}:${startColumn} / ${endLine}:${endColumn}`;
        try {
            const sourceFile = require(`!raw-loader!${filename}`);
            const sourceCode = sourceFile.subscring(sourcedecl.startCode, sourcedecl.endCode);
            return `${result} """${sourceCode}""`;
        } catch (readErr) {
            return result;
        }
    } catch (err) {
        return '(Source information unavailable)';
    }
}

export function raiseError(errorText) {
    // eslint-disable-next-line no-console
    console.error('Error: ', errorText);
    process.exit(1);
}
