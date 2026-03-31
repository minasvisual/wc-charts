export class ChartStats {
    constructor({ el, shadow }) {
        this.el = el;
        this.shadow = shadow;
        this.renderTemplate();
    }

    onAttributeChanged(name, oldValue, newValue) {
        if (oldValue !== newValue) this.updateView();
    }

    renderTemplate() {
        this.shadow.innerHTML = `
            <style>
                .stat-card {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: var(--wc-chart-align, center);
                    height: var(--wc-chart-height, 200px);
                    padding: var(--wc-chart-padding, 1.5rem);
                    box-sizing: border-box;
                    background: var(--wc-chart-bg, #ffffff);
                    border-radius: var(--wc-chart-radius, 16px);
                    box-shadow: var(--wc-chart-shadow, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                    color: var(--wc-chart-text-color, #1e293b);
                    font-family: var(--wc-chart-font, 'Inter', sans-serif);
                    transition: transform 0.2s ease;
                }
                .stat-card:hover {
                    box-shadow: var(--wc-chart-hover-shadow, 0 20px 25px -5px rgba(0, 0, 0, 0.1));
                    transform: translateY(-2px);
                }
                .stat-value {
                    font-size: var(--wc-chart-stat-size, 3.5rem);
                    font-weight: 800;
                    margin: 0;
                    line-height: 1;
                    background: var(--wc-chart-gradient, linear-gradient(135deg, #3b82f6, #8b5cf6));
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .stat-label {
                    font-size: var(--wc-chart-label-size, 1.1rem);
                    font-weight: 500;
                    color: #64748b;
                    margin-top: 0.5rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .stat-desc {
                    font-size: 0.85rem;
                    color: #94a3b8;
                    margin-top: 0.5rem;
                }
            </style>
            <div class="stat-card">
                <h1 class="stat-value" id="val">0</h1>
                <div class="stat-label" id="lbl">Métrica</div>
                <div class="stat-desc" id="desc"></div>
            </div>
        `;
        this.updateView();
    }

    updateView() {
        const val = this.el.getAttribute('value') || '0';
        const lbl = this.el.getAttribute('label') || '';
        const desc = this.el.getAttribute('desc') || '';
        
        const elVal = this.shadow.getElementById('val');
        const elLbl = this.shadow.getElementById('lbl');
        const elDesc = this.shadow.getElementById('desc');

        if (elVal) elVal.innerText = val;
        if (elLbl) elLbl.innerText = lbl;
        if (elDesc) elDesc.innerText = desc;
    }
}
