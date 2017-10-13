module.exports = function babelObjectSource({ types: t }) {
    return {
        visitor: {
            // ObjectExpression(path) {
            //     if (!path.node.loc) return;
            //     path.replaceWith(t.newExpression(t.identifier('FrozenObject'), [path.node]));
            // },
            // ArrayExpression(path) {
            //     if (!path.node.loc) return;
            //     path.replaceWith(t.newExpression(t.identifier('FrozenArray'), path.node.elements));
            // }
        }
    };
};
