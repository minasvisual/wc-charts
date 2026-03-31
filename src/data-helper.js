export class ChartDataHelper {
    /**
     * @param {Array<Object>} collection Array de dados originais. Estilo DataFrame do Pandas.
     */
    constructor(collection) {
        if (!Array.isArray(collection)) {
            console.warn('[WC Chart] Aviso: A coleção fornecida para o Helper não é um array.');
            collection = [];
        }
        // Clona raso pra não mutar a prop referência externa ao ordenar ou filtrar
        this.collection = [...collection];
        this.result = null; 
        this.lastOperation = ''; 
    }

    /**
     * Helper interno para resolver dot-notation (ex: 'price.unit', 'meta.barcode')
     */
    __getVal(obj, path) {
        if (!path || !obj) return undefined;
        return String(path).split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : undefined, obj);
    }

    getLabels(field) {
        if (!field) return '';
        const humanized = String(field)
            .replace(/[-_]/g, ' ')               
            .replace(/([A-Z])/g, ' $1')          
            .toLowerCase()                       
            .replace(/^\w|\s\w/g, c => c.toUpperCase()) 
            .trim();
        return humanized;
    }

    // ==========================================
    // DATA MANIPULATION (Pandas Inspired APIs)
    // ==========================================

    /**
     * query: Filtra a coleção nativa (semelhante ao df.query() ou df[df['x'] > y])
     * @param {string} field Nome do campo (suporta dot-notation "user.age")
     * @param {string|function} op Operador de filtro ('==', '!=', '>', '<', '>=', '<=', 'contains', 'in') OU função customizada
     * @param {any} val Valor para comparar
     */
    query(field, op, val) {
        this.collection = this.collection.filter(obj => {
            const current = this.__getVal(obj, field);
            
            // Suporte a função de filtro direta: .query('age', v => v > 18)
            if (typeof op === 'function') return op(current);

            switch (op) {
                case '==': return current == val;
                case '===': return current === val;
                case '!=': return current != val;
                case '>': return current > val;
                case '<': return current < val;
                case '>=': return current >= val;
                case '<=': return current <= val;
                case 'contains': 
                    return String(current).toLowerCase().includes(String(val).toLowerCase());
                case 'in':
                    return Array.isArray(val) && val.some(v => v == current);
                case 'not in':
                    return Array.isArray(val) && !val.some(v => v == current);
                default:
                    return current == op; // Caso o usuário passe .query('id', 5)
            }
        });
        return this; // Para encadear (ex: .query().sumBy().format())
    }

    /**
     * sortValues: Ordena a coleção pelo campo (semelhante ao df.sort_values())
     * @param {string} field Campo (suporta dot-notation)
     * @param {boolean} ascending Crescente se true, decrescente se false
     */
    sortValues(field, ascending = true) {
        this.collection.sort((a, b) => {
            const valA = this.__getVal(a, field);
            const valB = this.__getVal(b, field);
            
            if (valA === valB) return 0;
            const res = valA > valB ? 1 : -1;
            return ascending ? res : -res;
        });
        return this;
    }

    // ==========================================
    // AGGREGATION (Group By APIs)
    // ==========================================

    groupBy(field) {
        this.lastOperation = 'groupBy';
        this.result = this.collection.reduce((acc, obj) => {
            const raw = this.__getVal(obj, field);
            const key = raw !== undefined ? String(raw) : 'Desconhecido';
            if (!acc[key]) acc[key] = [];
            acc[key].push(obj);
            return acc;
        }, {});
        return this; 
    }

    countBy(field) {
        this.lastOperation = 'countBy';
        this.result = this.collection.reduce((acc, obj) => {
            const raw = this.__getVal(obj, field);
            const key = raw !== undefined ? String(raw) : 'Desconhecido';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        return this;
    }

    sumBy(groupField, sumField) {
        this.lastOperation = 'sumBy';
        this.result = this.collection.reduce((acc, obj) => {
            const rawGrp = this.__getVal(obj, groupField);
            const key = rawGrp !== undefined ? String(rawGrp) : 'Desconhecido';
            let value = this.__getVal(obj, sumField);
            
            let parsedValue = parseFloat(value);
            if (isNaN(parsedValue)) {
                parsedValue = 1;
            }
            
            acc[key] = (acc[key] || 0) + parsedValue;
            return acc;
        }, {});
        return this;
    }

    extractBy(field) {
        this.lastOperation = 'extractBy';
        this.result = this.collection.map(obj => {
            const raw = this.__getVal(obj, field);
            return String(raw !== undefined ? raw : '');
        });
        return this;
    }

    rangeBy(field, ranges) {
        this.lastOperation = 'rangeBy';
        
        if (!Array.isArray(ranges)) {
            console.warn('[WC Chart] Os ranges passados em rangeBy não estão em um array.');
            return this.groupBy(field); 
        }

        this.result = {};
        ranges.forEach(r => this.result[r.label || 'Outros'] = []);

        this.collection.forEach(obj => {
            const rawVal = this.__getVal(obj, field);
            let tsVal;
            if (rawVal instanceof Date) {
                tsVal = rawVal.getTime();
            } else if (typeof rawVal === 'string' && isNaN(Number(rawVal)) && !isNaN(Date.parse(rawVal))) {
                tsVal = Date.parse(rawVal);
            } else {
                tsVal = parseFloat(rawVal);
            }
            
            let matched = false;
            for (let r of ranges) {
                const min = r.min instanceof Date ? r.min.getTime() : parseFloat(r.min);
                const max = r.max instanceof Date ? r.max.getTime() : parseFloat(r.max);
                const withinMin = (r.min === undefined || r.min === null) ? true : tsVal >= min;
                const withinMax = (r.max === undefined || r.max === null) ? true : tsVal <= max;

                if (withinMin && withinMax) {
                    this.result[r.label].push(obj);
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                if (!this.result['Fora da Faixa']) this.result['Fora da Faixa'] = [];
                this.result['Fora da Faixa'].push(obj);
            }
        });
        return this;
    }

    // ==========================================
    // EXPORT
    // ==========================================

    getCount() {
        if (!this.result) return 0;
        if (Array.isArray(this.result)) return this.result.length;
        if (typeof this.result === 'object') return Object.keys(this.result).length;
        return 0;
    }

    format() {
        if (!this.result) return { x: '[]', y: '[]' };

        if (this.lastOperation === 'extractBy') {
            return { x: JSON.stringify(this.result), y: '[]' };
        }

        const x = [];
        const y = [];

        // Se há result mas quisemos antes ordenar, os dic/hashmaps nativos do node mantêm ordem de inserção do collection se as chaves forem strings de texto na maioria dos engines. Mas a filtragem "query" e "sortValues" já ocorreu na etapa linear do Pandas pra facilitar!
        for (const [key, value] of Object.entries(this.result)) {
            x.push(this.getLabels(key)); 
            
            if (Array.isArray(value)) {
                y.push(value.length);
            } else {
                y.push(value);
            }
        }

        return { x: JSON.stringify(x), y: JSON.stringify(y) }; 
    }
}
