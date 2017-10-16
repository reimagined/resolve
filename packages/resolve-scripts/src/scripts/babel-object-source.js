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

                path.replaceWith(
                    t.parenthesizedExpression(
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
                                        t.stringLiteral(
                                            path.hub.file.code.substring(
                                                path.node.start,
                                                path.node.end
                                            )
                                        )
                                    ),
                                    t.objectProperty(
                                        t.identifier('filename'),
                                        t.stringLiteral(path.hub.file.opts.filename)
                                    ),
                                    t.objectProperty(
                                        t.identifier('startLine'),
                                        t.numericLiteral(path.node.loc.start.line)
                                    ),
                                    t.objectProperty(
                                        t.identifier('startColumn'),
                                        t.numericLiteral(path.node.loc.start.column)
                                    ),
                                    t.objectProperty(
                                        t.identifier('endLine'),
                                        t.numericLiteral(path.node.loc.end.line)
                                    ),
                                    t.objectProperty(
                                        t.identifier('endColumn'),
                                        t.numericLiteral(path.node.loc.end.column)
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
