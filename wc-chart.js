import { Config } from './src/config.js';
import { ChartBar } from './src/charts/bar.js';
import { ChartPie } from './src/charts/pie.js';
import { ChartLine } from './src/charts/line.js';
import { ChartTimeSeries } from './src/charts/time-series.js';
import { ChartGauge } from './src/charts/gauge.js';
import { ChartHistogram } from './src/charts/histogram.js';
import { ChartScatter } from './src/charts/scatter.js';
import { ChartStats } from './src/charts/stats.js';
import { ChartHeatmap } from './src/charts/heatmap.js';
import { ChartExpression } from './src/charts/expression.js';
import { ChartDataHelper } from './src/data-helper.js';

// Registra os types built-in no Config através da nova função
Config.registerChart('bar', ChartBar);
Config.registerChart('pie', ChartPie);
Config.registerChart('line', ChartLine);
Config.registerChart('time-series', ChartTimeSeries);
Config.registerChart('gauge', ChartGauge);
Config.registerChart('histogram', ChartHistogram);
Config.registerChart('scatter', ChartScatter);
Config.registerChart('stats', ChartStats);
Config.registerChart('heatmap', ChartHeatmap);
Config.registerChart('expression', ChartExpression);

export { Config, ChartDataHelper }; // Exportando utilitários para desenvolvedores

export class WcChart extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.instance = null;

        // Dispara eventos 'click' encapsuladamente a partir do Shadow DOM
        this.shadowRoot.addEventListener('click', (e) => this.emitEvent('click', { originalEvent: e }));
    }

    static get observedAttributes() {
        return ['x', 'y', 'type', 'label', 'cutout', 'tension', 'value', 'max', 'color', 'desc', 'data', 'hue', 'template'];
    }

    emitEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: detail
        });
        this.dispatchEvent(event);
    }

    async connectedCallback() {
        // Acopla o Chart.js nativamente de forma assíncrona se não existir.
        // Isso isenta o usuário de chamar o `<script src="chart.umd.js">` no header da aplicação,
        // mas também protege ambientes SSR (como Next.js) de crasharem, pois este ciclo só roda na DOM.
        if (typeof window !== 'undefined' && !window.Chart) {
            if (!window._wcChartLoadingPromise) {
                window._wcChartLoadingPromise = import('./chart.umd.js')
                    .then(module => {
                        // Faz o bind forçado na global caso um Bundler (Webpack) tenha encapsulado o export
                        if (module && module.default && !window.Chart) {
                            window.Chart = module.default;
                        }
                    })
                    .catch(err => {
                        console.warn('[WC Chart] Erro ao carregar dependência embarcada do Chart.JS:', err);
                    });
            }
            await window._wcChartLoadingPromise;
        }

        this.render();
    }

    render() {
        this.ctype = this.getAttribute('type') || 'bar';
        
        const charts = Config.charts;
        const ChartSource = charts[this.ctype];

        if (!ChartSource) {
            this.handleError(`O tipo de gráfico '${this.ctype}' não está registrado em Config.charts.`);
            return;
        }

        this.emitEvent('before-mount', { type: this.ctype });

        try {
            this.instance = new ChartSource.source({
                el: this,
                shadow: this.shadowRoot,
                // Passa o emitEvent pro renderizador, caso ele precise notificar eventos próprios
                emitEvent: this.emitEvent.bind(this)
            });

            // Se a inicialização for assíncrona, aguardamos ou assumimos que já foi montado
            if (this.instance.renderedPromise) {
                this.instance.renderedPromise.then(() => {
                    this.emitEvent('after-mount', { type: this.ctype, instance: this.instance });
                });
            } else {
                // Caso contrário (como no timeout zero que fizemos em bar/pie)
                setTimeout(() => {
                    this.emitEvent('after-mount', { type: this.ctype, instance: this.instance });
                }, 10);
            }
        } catch (e) {
            this.handleError(`Erro ao inicializar o gráfico '${this.ctype}': ${e.message}`);
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'type' && this.instance) {
                this.shadowRoot.innerHTML = ''; 
                this.connectedCallback();
                this.emitEvent('updated', { component: this, attribute: name, from: oldValue, to: newValue });
                return;
            }

            if (this.instance && typeof this.instance.onAttributeChanged === 'function') {
                this.instance.onAttributeChanged(name, oldValue, newValue);
                this.emitEvent('updated', { component: this, attribute: name, from: oldValue, to: newValue });
            }
        }
    }

    handleError(message) {
        console.error(`[WC Chart] ${message}`);
        this.shadowRoot.innerHTML = `
            <style>
                .error { 
                    font-family: var(--wc-chart-font, 'Inter', sans-serif);
                    color: var(--wc-chart-error-color, #ef4444); 
                    background: var(--wc-chart-error-bg, #fef2f2); 
                    padding: 1rem; 
                    border-radius: 8px; 
                    border: 1px solid var(--wc-chart-error-border, #fca5a5);
                }
            </style>
            <div class="error"><b>WC-Chart Error:</b> ${message}</div>
        `;
    }
}

if (typeof customElements !== 'undefined') {
    customElements.define('wc-chart', WcChart);
}
