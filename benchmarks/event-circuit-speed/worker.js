import memoryDriver from 'resolve-bus-memory';
import createBus from 'resolve-bus';
import mongoDbDriver from 'resolve-storage-mongo';
import createStorage from 'resolve-storage';
import createEventStore from 'resolve-es';
import createExecutor from 'resolve-query';
import Immutable from 'seamless-immutable';
import config from './config';

const ROOT_GROUP_ID = 'root_id';

function createGroup(id) {
    return { id, members: {}, groups: {}, items: {}, parentGroup: null };
}

function updateGroup(state, groupId, name, value) {
    return state.groups[groupId] ? state.setIn(['groups', groupId, name], value) : state;
}

function updateGroupGroups(state, groupId, callback) {
    return state.updateIn(['groups', groupId, 'groups'], callback);
}

function moveGroup(state, groupId, nextParentId) {
    if (!state.groups[groupId] || !state.groups[nextParentId]) {
        return state;
    }
    const currentParentId = state.groups[groupId].parentGroup;
    if (!currentParentId) {
        return state;
    }
    let next = state;
    next = updateGroupGroups(next, currentParentId, list => list.without(groupId));
    next = updateGroupGroups(next, nextParentId, list => list.set(groupId, true));

    next = next.setIn(['groups', groupId, 'parentGroup'], nextParentId);

    return next;
}

function updateGroupMembers(state, groupId, callback) {
    return state.groups[groupId] ? state.updateIn(['groups', groupId, 'members'], callback) : state;
}

function addMemberToGroup(state, groupId, memberId) {
    const next = state.setIn(
        ['members', memberId, 'parentGroups'],
        state.members[memberId].parentGroups.set(groupId, true)
    );

    return updateGroupMembers(
        next,
        groupId,
        list => (list[memberId] ? list : list.set(memberId, true))
    );
}

function removeMemberFromGroup(state, groupId, memberId) {
    const next = state.setIn(
        ['members', memberId, 'parentGroups'],
        state.members[memberId].parentGroups.without(groupId)
    );

    return updateGroupMembers(next, groupId, list => list.without(memberId));
}

function updateOuterItem(state, innerItemId, callback) {
    return state.updateIn(['items', innerItemId], callback);
}

function updateOuterItemField(state, innerItemId, name, value) {
    return updateOuterItem(state, innerItemId, obj => obj.set(name, value));
}

function updateInnerItem(state, event, callback) {
    const outerItemId = event.aggregateId;
    const innerItemId = event.payload.innerItemId;
    if (!state.items[outerItemId].items[innerItemId]) {
        return state;
    }
    return state.updateIn(['items', outerItemId, 'items', innerItemId], callback);
}

const originalHandlers = {
    // GROUPS
    GroupCreated(state, event) {
        const id = event.aggregateId;
        const group = {
            ...createGroup(id),
            name: event.payload.name,
            type: event.payload.type
        };
        return state
            .updateIn(
                ['groups', ROOT_GROUP_ID, 'groups'],
                list => (list[id] ? list : list.set(id, true))
            )
            .setIn(['groups', id], group);
    },
    GroupDeleted(state, event) {
        const id = event.aggregateId;
        if (!state.groups[id]) {
            return state;
        }
        const parentId = state.groups[id].parentGroup;
        let next = state;
        if (parentId) {
            next = updateGroupGroups(next, parentId, list => list.without(id));
        }
        return next.update('groups', obj => obj.without(id));
    },
    GroupRenamed(state, event) {
        return updateGroup(state, event.aggregateId, 'name', event.payload.name);
    },
    GroupAddedToGroup(state, event) {
        return moveGroup(state, event.payload.groupId, event.aggregateId);
    },
    GroupRemovedFromGroup(state, event) {
        return moveGroup(state, event.payload.groupId, ROOT_GROUP_ID);
    },
    GroupMoved(state, event) {
        return moveGroup(state, event.aggregateId, event.payload.toGroupId);
    },
    MemberAddedToGroup(state, event) {
        return addMemberToGroup(state, event.aggregateId, event.payload.memberId);
    },
    MemberRemovedFromGroup(state, event) {
        return removeMemberFromGroup(state, event.aggregateId, event.payload.memberId);
    },
    MemberMoved(state, event) {
        const memberId = event.payload.memberId;
        const toGroupId = event.aggregateId;
        const fromGroupId = state.members[memberId].parentGroups[0];
        let next = state;
        if (memberId && toGroupId && fromGroupId) {
            next = removeMemberFromGroup(next, fromGroupId, memberId);
            next = addMemberToGroup(next, toGroupId, memberId);
        }
        return next;
    },

    // MEMBERS
    MemberCreated(state, event) {
        const id = event.aggregateId;
        return state.setIn(['members', id], {
            id,
            name: event.payload.name,
            items: {},
            parentGroups: {}
        });
    },
    MemberUpdated(state, event) {
        const id = event.aggregateId;
        return state.members[id]
            ? state.merge(
                {
                    members: {
                        [id]: event.payload
                    }
                },
                  { deep: true }
              )
            : state;
    },
    MemberDeleted(state, event) {
        const id = event.aggregateId;
        if (!state.members[id]) {
            return state;
        }

        const next = Object.keys(state.members[id].parentGroups).reduce(
            (acc, groupId) => removeMemberFromGroup(acc, groupId, id),
            state
        );

        return next.update('members', obj => obj.without(id));
    },

    // ITEMS
    OuterItemCreated(state, event) {
        const id = event.aggregateId;
        let newState = state.setIn(['items', id], {
            name: event.payload.name || 'New OuterItem',
            items: {}
        });
        if (event.payload.memberId && newState.members[event.payload.memberId]) {
            newState = newState.updateIn(['members', event.payload.memberId, 'items'], list =>
                list.set(id, true)
            );
        }
        if (event.payload.groupId && newState.groups[event.payload.groupId]) {
            newState = newState.updateIn(['groups', event.payload.groupId, 'items'], list =>
                list.set(id, true)
            );
        }
        return newState;
    },
    OuterItemUpdated: (state, event) =>
        updateOuterItemField(state, event.aggregateId, 'name', event.payload.name),
    OuterItemDeleted: (state, event) =>
        updateOuterItemField(state, event.aggregateId, 'isDeleted', true),
    InnerItemCreated: (state, event) =>
        state.setIn(['items', event.aggregateId, 'items', event.payload.innerItemId], {
            name: event.payload.name || 'New InnerItem'
        }),
    InnerItemUpdated: (state, event) =>
        updateInnerItem(state, event, obj =>
            obj.merge({
                name: event.payload.name
            })
        ),
    InnerItemDeleted: (state, event) =>
        updateInnerItem(state, event, obj => obj.set('isDeleted', true))
};

function projectionsGenerator(reportObj) {
    // Allow bypass invalid events
    const eventHandlers = Object.keys(originalHandlers).reduce(
        (acc, key) =>
            Object.assign(acc, {
                [key]: (state, event) => {
                    try {
                        const result = originalHandlers[key](state, event);
                        reportObj.value++;
                        return result;
                    } catch (err) {
                        console.error('CAUGHT ERROR', err); // eslint-disable-line no-console
                        return state;
                    }
                }
            }),
        Object.create(null)
    );

    return [
        {
            name: 'infrastructureState',
            initialState: Immutable({
                groups: {
                    [ROOT_GROUP_ID]: {
                        groups: [],
                        members: []
                    }
                },
                members: {},
                items: {}
            }),
            eventHandlers
        }
    ];
}

function generateSyncExecutor(storageDriver, busDriver, projections) {
    const loadDonePromise = new Promise((resolve) => {
        const originalLoadEventsByTypes = storageDriver.loadEventsByTypes.bind(storageDriver);
        storageDriver.loadEventsByTypes = (...args) =>
            originalLoadEventsByTypes(...args).then((result) => {
                resolve();
                return result;
            });
    });

    const storage = createStorage({ driver: storageDriver });
    const bus = createBus({ driver: busDriver });

    const eventStore = createEventStore({
        storage,
        bus
    });

    const execute = createExecutor({ eventStore, projections });

    return async (...args) => {
        await loadDonePromise;
        return execute(...args);
    };
}

export default function worker(eventsCount, reportObj) {
    const mongoDriver = mongoDbDriver({
        url: config.MONGODB_CONNECTION_URL,
        collection: config.MONGODB_COLLECTION_NAME
    });

    const busDriver = memoryDriver();

    const projections = projectionsGenerator(reportObj);

    const execute = generateSyncExecutor(mongoDriver, busDriver, projections);

    return execute('infrastructureState').then(state => ({
        entities: Object.keys(state.groups).length +
            Object.keys(state.members).length +
            Object.keys(state.items).length
    }));
}
