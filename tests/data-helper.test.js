import { describe, it, expect, vi } from 'vitest';
import { ChartDataHelper } from '../src/data-helper.js';

describe('ChartDataHelper Coverage', () => {
    describe('Constructor & __getVal', () => {
        it('should handle invalid collection inputs', () => {
            const originalWarn = console.warn;
            console.warn = vi.fn(); // Mocking

            const helper = new ChartDataHelper(null);
            expect(helper.collection).toEqual([]); // Fallback array empty
            expect(console.warn).toHaveBeenCalledWith('[WC Chart] Aviso: A coleção fornecida para o Helper não é um array.');
            
            console.warn = originalWarn; // Cleanup
        });

        it('should initialize correctly with arrays', () => {
            const helper = new ChartDataHelper([{ id: 1 }]);
            expect(helper.collection).toEqual([{ id: 1 }]);
        });

        it('__getVal should resolve deep paths', () => {
            const helper = new ChartDataHelper([]);
            const obj = { user: { name: 'Alice', age: 30 } };
            
            expect(helper.__getVal(obj, 'user.name')).toBe('Alice');
            expect(helper.__getVal(obj, 'user.age')).toBe(30);
            expect(helper.__getVal(obj, 'user.height')).toBeUndefined();
            expect(helper.__getVal(null, 'user.name')).toBeUndefined();
            expect(helper.__getVal(obj, null)).toBeUndefined();
        });
    });

    describe('getLabels string humanization', () => {
        it('should normalize dash, snake and camel cases', () => {
            const helper = new ChartDataHelper([]);
            expect(helper.getLabels('user_id')).toBe('User Id');
            expect(helper.getLabels('user-name')).toBe('User Name');
            expect(helper.getLabels('myFirstName')).toBe('My First Name');
            expect(helper.getLabels(null)).toBe('');
        });
    });

    describe('query (Filter Collection)', () => {
        const data = [
            { a: 10, b: 'active', meta: { p: 5 } },
            { a: 20, b: 'inactive', meta: { p: 15 } },
            { a: 30, b: 'active', meta: { p: 25 } }
        ];

        it('should filter by direct functional condition', () => {
            const helper = new ChartDataHelper(data);
            helper.query('a', v => v > 15);
            expect(helper.collection).toHaveLength(2);
        });

        it('should filter by strict and loose equals', () => {
            const helper1 = new ChartDataHelper(data).query('a', '==', '10');
            const helper2 = new ChartDataHelper(data).query('a', '===', 10);
            expect(helper1.collection).toHaveLength(1);
            expect(helper2.collection).toHaveLength(1);
        });

        it('should filter by inequality', () => {
            const helper = new ChartDataHelper(data).query('b', '!=', 'active');
            expect(helper.collection).toHaveLength(1);
        });

        it('should filter by relational operators', () => {
            const helper = new ChartDataHelper(data);
            expect(new ChartDataHelper(data).query('a', '>', 20).collection).toHaveLength(1);
            expect(new ChartDataHelper(data).query('a', '<', 20).collection).toHaveLength(1);
            expect(new ChartDataHelper(data).query('a', '>=', 20).collection).toHaveLength(2);
            expect(new ChartDataHelper(data).query('a', '<=', 20).collection).toHaveLength(2);
        });

        it('should filter by contains (string match)', () => {
            const helper = new ChartDataHelper(data).query('b', 'contains', 'act');
            expect(helper.collection).toHaveLength(3); // 'active' e 'inactive' contêm 'act'
        });

        it('should filter by in / not in', () => {
            const helperIn = new ChartDataHelper(data).query('a', 'in', ['10', '30']);
            expect(helperIn.collection).toHaveLength(2);

            const helperNotIn = new ChartDataHelper(data).query('a', 'not in', ['20', '30']);
            expect(helperNotIn.collection).toHaveLength(1);
        });

        it('should fallback to equality for unknown operator without value', () => {
            const helper = new ChartDataHelper(data).query('b', 'active');
            expect(helper.collection).toHaveLength(2);
        });
    });

    describe('sortValues', () => {
        const data = [
            { val: 20, nest: { d: 'c' } },
            { val: 10, nest: { d: 'b' } },
            { val: 30, nest: { d: 'a' } },
            { val: 30, nest: { d: 'a' } } // test equal swap
        ];

        it('should sort ascending and descending including dot-notation', () => {
            const sortedAsc = new ChartDataHelper(data).sortValues('val').collection;
            expect(sortedAsc[0].val).toBe(10);
            expect(sortedAsc[1].val).toBe(20);

            const sortedDesc = new ChartDataHelper(data).sortValues('val', false).collection;
            expect(sortedDesc[0].val).toBe(30);

            const nestedSort = new ChartDataHelper(data).sortValues('nest.d').collection;
            expect(nestedSort[0].nest.d).toBe('a');
            expect(nestedSort[1].nest.d).toBe('a'); // equal comparison
            expect(nestedSort[2].nest.d).toBe('b');
        });
    });

    describe('groupBy', () => {
        const data = [
            { cat: 'A', name: 'Z' },
            { cat: 'B', name: 'Y' },
            { cat: 'A', name: 'X' },
            { name: 'W' } // missing cat
        ];

        it('should group objects into dictionary arrays', () => {
            const helper = new ChartDataHelper(data).groupBy('cat');
            expect(helper.result['A']).toHaveLength(2);
            expect(helper.result['B']).toHaveLength(1);
            expect(helper.result['Desconhecido']).toHaveLength(1);
        });
    });

    describe('countBy', () => {
        const data = [ { t: 'type1' }, { t: 'type2' }, { t: 'type1' }, {} ];

        it('should tally items as integers', () => {
            const helper = new ChartDataHelper(data).countBy('t');
            expect(helper.result['type1']).toBe(2);
            expect(helper.result['type2']).toBe(1);
            expect(helper.result['Desconhecido']).toBe(1);
        });
    });

    describe('sumBy', () => {
        const data = [
            { g: 'A', p: 10 },
            { g: 'A', p: '20' }, // Parses to float
            { g: 'B', p: 'abc' }, // Fallback to 1 (Count)
            { g: 'B', p: 40 },
            { no_g: true }
        ];

        it('should sum numbers and fallback to count 1 for non-numeric additions', () => {
            const helper = new ChartDataHelper(data).sumBy('g', 'p');
            expect(helper.result['A']).toBe(30);
            expect(helper.result['B']).toBe(41); // 'abc'=1 + 40
            expect(helper.result['Desconhecido']).toBe(1); // val undefined fallbacks to 1
        });
    });

    describe('extractBy', () => {
        const data = [{ v: 10 }, { v: 20 }, {}];

        it('should map field values as flat array of strings', () => {
            const helper = new ChartDataHelper(data).extractBy('v');
            expect(helper.result).toEqual(['10', '20', '']);
        });
    });

    describe('rangeBy', () => {
        const data = [
            { age: 5 }, { age: 15 }, { age: 25 }, { age: 'not_num' },
            { date: new Date('2021-01-01') }, { date: '2022-01-01' }, { date: 'inv' }
        ];

        it('should range numbers properly with fallbacks', () => {
            const ranges = [
                { label: 'Crianças', min: 0, max: 10 },
                { label: 'Adolescentes', min: 11, max: 20 },
                { label: 'Outros', min: 21, max: null } // Max unlimited test
            ];
            const helper = new ChartDataHelper(data).rangeBy('age', ranges);
            expect(helper.result['Crianças'].length).toBe(1);
            expect(helper.result['Adolescentes'].length).toBe(1);
            expect(helper.result['Outros'].length).toBe(1);
            expect(helper.result['Fora da Faixa'].length).toBe(4); // Non age matches
        });

        it('should range Dates accurately', () => {
            const timeRanges = [
                { label: 'Passado', min: new Date('2020-01-01'), max: new Date('2022-12-31') }
            ];
            const helper = new ChartDataHelper(data).rangeBy('date', timeRanges);
            expect(helper.result['Passado'].length).toBe(2);
        });

        it('should fallback to groupBy if rules are invalid', () => {
            const originalWarn = console.warn;
            console.warn = vi.fn();
            const helper = new ChartDataHelper([{age: 10}]).rangeBy('age', 'invalid');
            expect(helper.lastOperation).toBe('groupBy');
            console.warn = originalWarn;
        });
    });

    describe('getCount & format exports', () => {
        it('format and getCount empty dataset behavior', () => {
            const helper = new ChartDataHelper([]);
            expect(helper.getCount()).toBe(0);
            expect(helper.format()).toEqual({ x: '[]', y: '[]' });
        });

        it('extractBy formatting logic', () => {
            const helper = new ChartDataHelper([{v: 'A'}, {v: 'B'}]).extractBy('v');
            expect(helper.getCount()).toBe(2);
            expect(helper.format()).toEqual({ x: '["A","B"]', y: '[]' });
        });

        it('groupBy / rangeBy formatting arrays logic', () => {
            // Arrays in results triggers .length assignment on format.y
            const helper = new ChartDataHelper([{c: 'X'}, {c: 'X'}, {c: 'Y'}]).groupBy('c');
            expect(helper.getCount()).toBe(2); // Two unique keys: X, Y
            const formatted = helper.format();
            expect(formatted.x).toBe('["X","Y"]');
            expect(formatted.y).toBe('[2,1]'); // Stringified array length
        });

        it('sumBy / countBy formatting numbers logic', () => {
            // Ints/Floats in results passes value directly to Y
            const helper = new ChartDataHelper([{c: 'Alpha'}]).countBy('c');
            expect(helper.getCount()).toBe(1);
            const formatted = helper.format();
            expect(formatted.x).toBe('["Alpha"]');
            expect(formatted.y).toBe('[1]');
        });
    });
});
