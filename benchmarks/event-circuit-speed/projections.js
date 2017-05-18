import Immutable from 'seamless-immutable';

const timePeriods = {
    2015.1: { startDate: new Date(2015, 1), endDate: new Date(2015, 6) },
    2015.2: { startDate: new Date(2015, 7), endDate: new Date(2015, 12) },
    2016.1: { startDate: new Date(2016, 1), endDate: new Date(2016, 6) },
    2016.2: { startDate: new Date(2016, 7), endDate: new Date(2016, 12) },
    2017.1: { startDate: new Date(2017, 1), endDate: new Date(2017, 6) }
};

const ROOT_ORGUNIT_ID = 'root_id';

function reportError(message) {
    console.error(message); // eslint-disable-line no-console
}

function createOrgUnit(id) {
    return { id, users: {}, orgUnits: {}, objectives: {}, parentOrgUnit: null };
}

function updateOrgUnit(state, orgUnitId, name, value) {
    return state.orgUnits[orgUnitId]
        ? state.setIn(['orgUnits', orgUnitId, name], value)
        : state;
}

function updateOrgUnitOrgUnits(state, orgUnitId, callback) {
    return state.updateIn(['orgUnits', orgUnitId, 'orgUnits'], callback);
}

function moveOrgUnit(state, orgUnitId, nextParentId) {
    if (!state.orgUnits[orgUnitId] || !state.orgUnits[nextParentId]) {
        return state;
    }
    const currentParentId = state.orgUnits[orgUnitId].parentOrgUnit;
    if (!currentParentId) {
        return state;
    }
    let next = state;
    next = updateOrgUnitOrgUnits(next, currentParentId,
        list => list.without(orgUnitId));
    next = updateOrgUnitOrgUnits(next, nextParentId,
        list => list.set(orgUnitId, true));

    next = next.setIn(['orgUnits', orgUnitId, 'parentOrgUnit'], nextParentId);

    return next;
}

function updateOrgUnitUsers(state, orgUnitId, callback) {
    return state.orgUnits[orgUnitId]
        ? state.updateIn(['orgUnits', orgUnitId, 'users'], callback)
        : state;
}

function addUserToOrgUnit(state, orgUnitId, userId) {
    const next = state.setIn(
        ['users', userId, 'parentOrgUnits'],
        state.users[userId].parentOrgUnits.set(orgUnitId, true)
    );

    return updateOrgUnitUsers(next, orgUnitId, list =>
        (list[userId] ? list : list.set(userId, true))
    );
}

function removeUserFromOrgUnit(state, orgUnitId, userId) {
    const next = state.setIn(
        ['users', userId, 'parentOrgUnits'],
        state.users[userId].parentOrgUnits.without(orgUnitId)
    );

    return updateOrgUnitUsers(next, orgUnitId, list =>
        list.without(userId)
    );
}

function updateObjective(state, objectiveId, callback) {
    return state.updateIn(['objectives', objectiveId], callback);
}

function updateObjectiveField(state, objectiveId, name, value) {
    return updateObjective(state, objectiveId, obj => obj.set(name, value));
}

function updateKeyResult(state, event, callback) {
    const objectiveId = event.aggregateId;
    const keyResultId = event.payload.keyResultId;
    if (!state.objectives[objectiveId].keyResults[keyResultId]) {
        reportError(`${event.type}: key result is not found ${JSON.stringify(event.payload)}`
            + `/ ${objectiveId} ${state.objectives[objectiveId].title}`);
        return state;
    }
    return state.updateIn(['objectives', objectiveId, 'keyResults', keyResultId], callback);
}

const originalHandlers = {
    // ORGUNIT
    OrgUnitCreated(state, event) {
        const id = event.aggregateId;
        const orgUnit = {
            ...createOrgUnit(id),
            name: event.payload.name,
            type: event.payload.type
        };
        return state
            .updateIn(['orgUnits', ROOT_ORGUNIT_ID, 'orgUnits'], list =>
                (list[id] ? list : list.set(id, true))
            )
            .setIn(['orgUnits', id], orgUnit);
    },
    OrgUnitDeleted(state, event) {
        const id = event.aggregateId;
        if (!state.orgUnits[id]) {
            return state;
        }
        const parentId = state.orgUnits[id].parentOrgUnit;
        let next = state;
        if (parentId) {
            next = updateOrgUnitOrgUnits(next, parentId, list => list.without(id));
        }
        return next.update('orgUnits', obj => obj.without(id));
    },
    OrgUnitRenamed(state, event) {
        return updateOrgUnit(state, event.aggregateId, 'name', event.payload.name);
    },
    OrgUnitChangedType(state, event) {
        return updateOrgUnit(state, event.aggregateId, 'type', event.payload.type);
    },
    OrgUnitAddedToOrgUnit(state, event) {
        return moveOrgUnit(state, event.payload.orgUnitId, event.aggregateId);
    },
    OrgUnitRemovedFromOrgUnit(state, event) {
        return moveOrgUnit(state, event.payload.orgUnitId, ROOT_ORGUNIT_ID);
    },
    OrgUnitMoved(state, event) {
        return moveOrgUnit(state, event.aggregateId, event.payload.toOrgUnitId);
    },
    UserAddedToOrgUnit(state, event) {
        return addUserToOrgUnit(state, event.aggregateId, event.payload.userId);
    },
    UserRemovedFromOrgUnit(state, event) {
        return removeUserFromOrgUnit(state, event.aggregateId, event.payload.userId);
    },
    UserMoved(state, event) {
        const userId = event.payload.userId;
        const toOrgUnitId = event.aggregateId;
        const fromOrgUnitId = state.users[userId].parentOrgUnits[0];
        let next = state;
        if (userId && toOrgUnitId && fromOrgUnitId) {
            next = removeUserFromOrgUnit(next, fromOrgUnitId, userId);
            next = addUserToOrgUnit(next, toOrgUnitId, userId);
        }
        return next;
    },

    // USERS
    UserCreated(state, event) {
        const id = event.aggregateId;
        return state.setIn(['users', id], {
            id,
            name: event.payload.displayName || event.payload.email,
            email: event.payload.email,
            objectives: {},
            parentOrgUnits: {}
        });
    },
    UserUpdated(state, event) {
        const id = event.aggregateId;
        return state.users[id]
            ? state.merge({
                users: {
                    [id]: event.payload
                }
            }, { deep: true })
            : state;
    },
    UserDeleted(state, event) {
        const id = event.aggregateId;
        if (!state.users[id]) {
            return state;
        }

        const next = Object.keys(state.users[id].parentOrgUnits).reduce(
            (acc, orgUnitId) => removeUserFromOrgUnit(acc, orgUnitId, id),
            state
        );

        return next.update('users', obj => obj.without(id));
    },

    // OBJECTIVES
    ObjectiveCreated(state, event) {
        const id = event.aggregateId;
        let newState = state.setIn(
            ['objectives', id], {
                title: event.payload.title || 'New Objective',
                keyResults: {},
                period: event.payload.period
            }
        );
        if (event.payload.userId) {
            if (!newState.users[event.payload.userId]) {
                reportError(`ObjectiveCreated: user is not found ${event.payload.userId}` +
                    ` / ${id} ${event.payload.title}`);
            } else {
                newState = newState.updateIn(['users', event.payload.userId, 'objectives'],
                    list => list.set(id, true));
            }
        }
        if (event.payload.orgUnitId) {
            if (!newState.orgUnits[event.payload.orgUnitId]) {
                reportError(`ObjectiveCreated: orgUnit is not found ${event.payload.orgUnitId}` +
                    ` / ${id} ${event.payload.title}`);
            } else {
                newState = newState.updateIn(['orgUnits', event.payload.orgUnitId, 'objectives'],
                    list => list.set(id, true));
            }
        }
        return newState;
    },
    ObjectiveTitleChanged: (state, event) =>
        updateObjectiveField(state, event.aggregateId, 'title', event.payload.title),
    ObjectivePeriodChanged: (state, event) =>
        updateObjectiveField(state, event.aggregateId, 'period', event.payload.period),
    ObjectiveDeleted: (state, event) =>
        updateObjectiveField(state, event.aggregateId, 'isDeleted', true),
    ObjectiveRestored: (state, event) =>
        updateObjective(state, event.aggregateId, obj => obj.without('isDeleted')),
    KeyResultAdded: (state, event) =>
        state.setIn(['objectives', event.aggregateId, 'keyResults', event.payload.keyResultId], {
            title: event.payload.title || 'New key',
            progress: event.payload.progress || 0
        }),
    KeyResultUpdated: (state, event) =>
        updateKeyResult(state, event, obj => obj.merge({
            title: event.payload.title,
            progress: event.payload.progress
        })),
    KeyResultDeleted: (state, event) =>
        updateKeyResult(state, event, obj => obj.set('isDeleted', true)),
    KeyResultRestored: (state, event) =>
        updateKeyResult(state, event, obj => obj.without('isDeleted')),

    // AllObjectivesCleared: state => state.setIn(['objectives'], {}),
    TimePeriodCreated: (state, event) =>
        state.setIn(['timePeriods', event.payload.name], event.payload.date)
};

// Allow bypass invalid events
const eventHandlers = Object.keys(originalHandlers).reduce(
    (acc, key) => Object.assign(acc, { [key]: (state, event) => {
        try {
            return originalHandlers[key](state, event);
        } catch (err) {
            console.error('CAUGHT ERROR', err); // eslint-disable-line no-console
            return state;
        }
    } }),
    Object.create(null)
);

export const projections = [
    {
        name: 'okrState',
        initialState: () => Immutable({
            orgUnits: {
                [ROOT_ORGUNIT_ID]: {
                    orgUnits: [],
                    users: []
                }
            },
            users: {},
            objectives: {},
            timePeriods
        }),
        eventHandlers
    }
];
