import mockery from 'mockery';
import sinon from 'sinon';

mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

let foundArray = [];

mockery.registerMock('mongodb', {
    _setFindResult: (array) => {
        if (Array.isArray(array)) {
            foundArray = array;
        } else {
            foundArray = [];
        }
    },
    MongoClient: {
        connect: sinon.spy(() =>
            Promise.resolve({
                collection: sinon.spy(() => ({
                    insert: sinon.spy(() => Promise.resolve()),
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
                    ensureIndex: sinon.spy(() => Promise.resolve())
                }))
            })
        )
    }
});
