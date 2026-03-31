export class ChartGauge {
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

    getParams() {
        const val = parseFloat(this.el.getAttribute('value')) || 0;
        const max = parseFloat(this.el.getAttribute('max')) || 100;
        return {
            val: val,
            max: max,
            diff: Math.max(0, max - val),
            label: this.el.getAttribute('label') || 'Progresso',
            color: this.el.getAttribute('color') || 'rgba(54, 162, 235, 1)'
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
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
                .label-container {
                    position: absolute;
                    bottom: 25%;
                    text-align: center;
                    width: 100%;
                }
                .label-value {
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: var(--wc-chart-text-color, #1e293b);
                    margin: 0;
                    line-height: 1;
                }
                .label-title {
                    font-size: 0.9rem;
                    color: #64748b;
                    margin: 0;
                }
                canvas { display: block; }
            </style>
            <div class="chart-container">
                <canvas></canvas>
                <div class="label-container">
                    <p class="label-value" id="val-text">0</p>
                    <p class="label-title" id="val-title">Metric</p>
                </div>
            </div>
        `;
    }

    initChart() {
        const canvas = this.shadow.querySelector('canvas');
        if (!canvas || typeof Chart === 'undefined') return;

        const { val, max, diff, color, label } = this.getParams();
        this.shadow.getElementById('val-text').innerText = val;
        this.shadow.getElementById('val-title').innerText = label;

        this.chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: [label, 'Faltante'],
                datasets: [{
                    data: [val, diff],
                    backgroundColor: [color, 'rgba(0, 0, 0, 0.05)'],
                    borderWidth: 0,
                    circumference: 180, // Medida arco Gauge (Meia lua)
                    rotation: 270       // Rotação inicial p/ colocar a base em baixo
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '80%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    updateChart() {
        if (!this.chartInstance) return;
        const { val, diff, color, label } = this.getParams();
        this.shadow.getElementById('val-text').innerText = val;
        this.shadow.getElementById('val-title').innerText = label;
        this.chartInstance.data.datasets[0].data = [val, diff];
        this.chartInstance.data.datasets[0].backgroundColor[0] = color;
        this.chartInstance.update();
    }
}
