export class ChartBar {
    constructor({ el, shadow }) {
        this.el = el;
        this.shadow = shadow;
        this.chartInstance = null;
        
        // Atributos específicos
        this.backgroundColors = [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
        ];
        
        this.borderColors = this.backgroundColors.map(c => c.replace('0.7)', '1)'));
        
        this.renderTemplate();
        // Permite atraso para o motor desenhar o template e inicializar o Canvas
        setTimeout(() => this.initChart(), 0);
    }

    // Chamado sempre que o web component detectar uma alteração em seus atributos
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

    // Pega os parâmetros específicos para esse gráfico
    getParams() {
        return {
            x: this.parseData(this.el.getAttribute('x')),
            y: this.parseData(this.el.getAttribute('y')),
            label: this.el.getAttribute('label') || 'Valores'
        };
    }

    renderTemplate() {
        // Usa o layout glassmorphism/moderno estabelecido
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
            console.error("[WC Chart] Chart.js não encontrado para renderizar BarChart.");
            return;
        }

        const { x, y, label } = this.getParams();

        const config = {
            type: 'bar',
            data: {
                labels: x,
                datasets: [{
                    label: label,
                    data: y,
                    backgroundColor: this.backgroundColors,
                    borderColor: this.borderColors,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { family: "'Inter', sans-serif" } }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    x: {
                        grid: { display: false }
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
