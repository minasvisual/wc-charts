export class ChartPie {
    constructor({ el, shadow }) {
        this.el = el;
        this.shadow = shadow;
        this.chartInstance = null;
        
        // Atributos específicos
        this.backgroundColors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)'
        ];
        
        this.borderColors = this.backgroundColors.map(c => c.replace('0.7)', '1)'));
        
        this.renderTemplate();
        setTimeout(() => this.initChart(), 0);
    }

    onAttributeChanged(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.updateChart();
        }
    }

    parseData(attrValue) {
        try {
            return JSON.parse(attrValue);
        } catch {
            return [];
        }
    }

    getParams() {
        return {
            x: this.parseData(this.el.getAttribute('x')),
            y: this.parseData(this.el.getAttribute('y')),
            label: this.el.getAttribute('label') || 'Valores',
            cutout: this.el.getAttribute('cutout') || '0' // Exemplo de atributo custom específico pra um gráfico do tipo pie (ex: transformar em donut)
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
                    box-shadow: var(--wc-chart-shadow, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05));
                    transition: all 0.3s ease;
                }
                .chart-container:hover {
                    box-shadow: var(--wc-chart-hover-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04));
                }
                canvas {
                    display: block;
                }
            </style>
            <div class="chart-container">
                <canvas></canvas>
            </div>
        `;
    }

    initChart() {
        const canvas = this.shadow.querySelector('canvas');
        if (!canvas) return;

        if (typeof Chart === 'undefined') {
            console.error("[WC Chart] Chart.js não encontrado para renderizar PieChart.");
            return;
        }

        const { x, y, label, cutout } = this.getParams();

        const config = {
            type: cutout !== '0' ? 'doughnut' : 'pie',
            data: {
                labels: x,
                datasets: [{
                    label: label,
                    data: y,
                    backgroundColor: this.backgroundColors,
                    borderColor: this.borderColors,
                    borderWidth: 1,
                    hoverOffset: 6
                }]
            },
            options: {
                cutout: cutout + '%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: "'Inter', sans-serif" } }
                    }
                }
            }
        };

        this.chartInstance = new Chart(canvas.getContext('2d'), config);
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
