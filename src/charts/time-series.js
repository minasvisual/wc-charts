export class ChartTimeSeries {
    constructor({ el, shadow }) {
        this.el = el;
        this.shadow = shadow;
        this.chartInstance = null;
        this.renderTemplate();
        setTimeout(() => this.initChart(), 0);
    }

    onAttributeChanged(name, oldValue, newValue) {
        if (oldValue !== newValue) this.updateChart();
    }

    parseData(attrValue) {
        try { return JSON.parse(attrValue); } catch { return []; }
    }

    getParams() {
        return {
            x: this.parseData(this.el.getAttribute('x')), // Espera arrays de strings "2026-03-31" ou ts
            y: this.parseData(this.el.getAttribute('y')),
            label: this.el.getAttribute('label') || 'Timeline'
        };
    }

    renderTemplate() {
        this.shadow.innerHTML = `
            <style>
                .chart-container {
                    position: relative;
                    height: var(--wc-chart-height, 400px);
                    width: 100%;
                    padding: var(--wc-chart-padding, 1.5rem);
                    box-sizing: border-box;
                    background: var(--wc-chart-bg, #ffffff);
                    border-radius: var(--wc-chart-radius, 16px);
                    box-shadow: var(--wc-chart-shadow, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                }
                canvas { display: block; }
            </style>
            <div class="chart-container"><canvas></canvas></div>
        `;
    }

    initChart() {
        const canvas = this.shadow.querySelector('canvas');
        if (!canvas || typeof Chart === 'undefined') return;

        const { x, y, label } = this.getParams();

        // Para evitar pacotes do date-adapter, apenas plotamos os pontos como labels categóricas 
        // e formatamos os grids/ticks pra exibição de forma condensada
        this.chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: x,
                datasets: [{
                    label: label,
                    data: y,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 2,
                    pointRadius: 1, // Pontos minimos p/ parecer serie temporal contínua
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            maxTicksLimit: 10,
                            maxRotation: 0,
                            autoSkip: true
                        }
                    }
                }
            }
        });
    }

    updateChart() {
        if (!this.chartInstance) return;
        const { x, y, label } = this.getParams();
        this.chartInstance.data.labels = x;
        this.chartInstance.data.datasets[0].data = y;
        this.chartInstance.data.datasets[0].label = label;
        this.chartInstance.update();
    }
}
