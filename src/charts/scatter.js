export class ChartScatter {
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
        const xArr = this.parseData(this.el.getAttribute('x'));
        const yArr = this.parseData(this.el.getAttribute('y'));
        
        // Scatter exige pares ordenados {x, y} no data array
        // Zip dos dois atributos (se mandaram strings separadas)
        const pointData = [];
        const length = Math.min(xArr.length, yArr.length);
        for(let i=0; i<length; i++) {
            pointData.push({ x: parseFloat(xArr[i]), y: parseFloat(yArr[i]) });
        }

        return {
            data: pointData, // O dataset no chartjs
            label: this.el.getAttribute('label') || 'Correlação X/Y'
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

        const { data, label } = this.getParams();

        this.chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'scatter',
            data: {
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: 'rgba(153, 102, 255, 0.8)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', position: 'bottom' },
                    y: { type: 'linear' }
                }
            }
        });
    }

    updateChart() {
        if (!this.chartInstance) return;
        const { data, label } = this.getParams();
        this.chartInstance.data.datasets[0].data = data;
        this.chartInstance.data.datasets[0].label = label;
        this.chartInstance.update();
    }
}
