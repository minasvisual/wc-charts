// Registry for chart renderers
export const Config = {
    charts: {},
    
    /**
     * Registra um novo tipo de gráfico para o web component
     * @param {string} type - O identificador do tipo (ex: 'radar', 'scatter')
     * @param {class} sourceClass - A classe construtora do gráfico
     */
    registerChart(type, sourceClass) {
        this.charts[type] = { source: sourceClass };
    }
};
