import mockery from 'mockery';
import sinon from 'sinon';

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

let toArray;

mockery.registerMock('mongodb', {
    _setToArray: (func) => {
        toArray = func;
    },
    MongoClient: {
        connect: sinon.spy(() => Promise.resolve({
            collection: sinon.spy(() => {
                const find = sinon.spy(() => {
                    const result = {
                        skip: sinon.spy(() => result),
                        limit: sinon.spy(() => result),
                        sort: sinon.spy(() => result),
                        toArray
                    };
                    return result;
                });

                return {
                    insert: sinon.spy(() => Promise.resolve()),
                    find
                };
            })
        }))
    }
});
