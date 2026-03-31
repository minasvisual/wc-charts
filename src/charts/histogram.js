export class ChartHistogram {
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
            x: this.parseData(this.el.getAttribute('x')), // Ranges ou classes (ex: "10-20")
            y: this.parseData(this.el.getAttribute('y')), // Frequências
            label: this.el.getAttribute('label') || 'Distribuição Frequência'
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

        this.chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: x,
                datasets: [{
                    label: label,
                    data: y,
                    backgroundColor: 'rgba(255, 159, 64, 0.7)',
                    borderColor: 'rgba(255, 159, 64, 1)',
                    borderWidth: 1,
                    barPercentage: 1,
                    categoryPercentage: 1 // Gruda as barras umas nas outras como em um hist puro
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { display: false, drawBorder: true }
                    },
                    y: {
                        beginAtZero: true
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
