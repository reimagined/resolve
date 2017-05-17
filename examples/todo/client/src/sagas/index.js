import fetch from 'isomorphic-fetch';
import { put, call } from 'redux-saga/effects';

import { updateCards } from '../actions/cards';

function* getInitialCards() {
    const cards = yield call(() =>
        fetch('/api/cards').then(res => res.json())
    );
    yield put(updateCards(cards));
}

export default function*() {
    yield getInitialCards();
}
