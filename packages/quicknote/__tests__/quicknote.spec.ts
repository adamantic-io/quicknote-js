import quicknote from '..';

describe('Quicknote', () => {

    // jest test to check that the Quicknote singleton is instantiated correctly
    test('Quicknote singleton', () => {
        const q1 = quicknote();
        const q2 = quicknote();
        expect(q1).toBe(q2);
    });

});
