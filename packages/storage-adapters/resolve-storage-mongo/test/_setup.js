import mockery from 'mockery';
import sinon from 'sinon';

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

let foundArray = [];
let isRejectInsert = false;

mockery.registerMock('mongodb', {
    _setFindResult: (array) => {
        if (Array.isArray(array)) {
            foundArray = array;
        } else {
            foundArray = [];
        }
    },
    _setInsertCommandReject: (isReject) => {
        isRejectInsert = isReject;
    },
    MongoClient: {
        connect: sinon.spy(() =>
            Promise.resolve({
                collection: sinon.spy(() => ({
                    insert: sinon.spy(
                        () =>
                            !isRejectInsert ? Promise.resolve() : Promise.reject({ code: 11000 })
                    ),
                    find: sinon.spy(() => ({
                        stream: sinon.spy(() => ({
                            on: (event, callback) => {
                                if (event === 'data') {
                                    foundArray.forEach(elm => callback(elm));
                                } else if (event === 'end') {
                                    callback();
                                }
                            }
                        }))
                    })),
                    createIndex: sinon.spy(() => Promise.resolve())
                }))
            })
        )
    }
});
