module.exports = function ({ types: t }) {
    const WRAP_NAME = '__WRAP_OBJECT_CREATION_WITH_SOURCE_MAP__';
    const SOURCE_NAME = '__SOURCE_DELCARATION__';
    return {
        visitor: {
            'ObjectExpression|ArrayExpression|NewExpression': function (path, state) {
                const wrappedParent = path.findParent(
                    parent =>
                        parent.node &&
                        parent.node.callee &&
                        parent.node.callee.id &&
                        parent.node.callee.id.name === WRAP_NAME
                );
                if (wrappedParent) {
                    const skip =
                        wrappedParent.node.arguments.indexOf(path.node) > -1 ||
                        wrappedParent.node.callee.body.body[0].block.body[0].expression
                            .arguments[2] === path.node;
                    if (skip) return;
                }

                const sourceInfo = {
                    filename: 'Source file name not available',
                    startLine: NaN,
                    startColumn: NaN,
                    endLine: NaN,
                    endColumn: NaN,
                    startCode: NaN,
                    endCode: NaN
                };
                try {
                    sourceInfo.filename = path.hub.file.opts.filename;
                    sourceInfo.startCode = path.node.start;
                    sourceInfo.endCode = path.node.end;
                    sourceInfo.startLine = path.node.loc.start.line;
                    sourceInfo.startColumn = path.node.loc.start.column;
                    sourceInfo.endLine = path.node.loc.end.line;
                    sourceInfo.endColumn = path.node.loc.end.column;
                } catch (err) {}

                path.replaceWith(
                    t.conditionalExpression(
                        t.booleanLiteral(false),
                        t.booleanLiteral(false),
                        t.callExpression(
                            t.functionExpression(
                                t.identifier(WRAP_NAME),
                                [t.identifier('inputObject'), t.identifier('pathInfo')],
                                t.blockStatement([
                                    t.tryStatement(
                                        t.blockStatement([
                                            t.expressionStatement(
                                                t.callExpression(
                                                    t.memberExpression(
                                                        t.identifier('Object'),
                                                        t.identifier('defineProperty')
                                                    ),
                                                    [
                                                        t.identifier('inputObject'),
                                                        t.stringLiteral(SOURCE_NAME),
                                                        t.objectExpression([
                                                            t.objectProperty(
                                                                t.identifier('value'),
                                                                t.identifier('pathInfo')
                                                            )
                                                        ])
                                                    ]
                                                )
                                            )
                                        ]),
                                        t.catchClause(t.identifier('err'), t.blockStatement([]))
                                    ),

                                    t.returnStatement(t.identifier('inputObject'))
                                ]),
                                false,
                                false
                            ),
                            [
                                path.node,
                                t.objectExpression([
                                    t.objectProperty(
                                        t.identifier('sourceCode'),
                                        t.stringLiteral(sourceInfo.sourceCode)
                                    ),
                                    t.objectProperty(
                                        t.identifier('filename'),
                                        t.stringLiteral(sourceInfo.filename)
                                    ),
                                    t.objectProperty(
                                        t.identifier('startLine'),
                                        t.numericLiteral(sourceInfo.startLine)
                                    ),
                                    t.objectProperty(
                                        t.identifier('startColumn'),
                                        t.numericLiteral(sourceInfo.startColumn)
                                    ),
                                    t.objectProperty(
                                        t.identifier('endLine'),
                                        t.numericLiteral(sourceInfo.endLine)
                                    ),
                                    t.objectProperty(
                                        t.identifier('endColumn'),
                                        t.numericLiteral(sourceInfo.endColumn)
                                    )
                                ])
                            ]
                        )
                    )
                );
            }
        }
    };
};
