import test from 'node:test'
import assert from 'node:assert/strict'
import { readRoute } from '../src/lib/navigation.mjs'

test('restaurant routes retain the originating section', () => {
    assert.deepEqual(readRoute('#restaurants/ChIJ_123-abc'), { name: 'explore', placeId: 'ChIJ_123-abc' })
    assert.deepEqual(readRoute('#saved-restaurants/ChIJ_123-abc'), { name: 'lists', placeId: 'ChIJ_123-abc' })
    assert.deepEqual(readRoute('#saved-restaurants'), { name: 'lists', placeId: null })
    assert.deepEqual(readRoute('#account'), { name: 'account', placeId: null })
})

test('unknown or malformed routes safely return to Explore', () => {
    for (const hash of ['', '#other', '#account/place', '#restaurants/%', '#restaurants/a/b', '#restaurants/']) {
        assert.deepEqual(readRoute(hash), { name: 'explore', placeId: null })
    }
})
