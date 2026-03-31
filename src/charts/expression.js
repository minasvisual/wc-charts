export class ChartExpression {
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
                .exp-card {
                    padding: var(--wc-chart-padding, 1.5rem);
                    background: var(--wc-chart-bg, #ffffff);
                    border-radius: var(--wc-chart-radius, 16px);
                    box-shadow: var(--wc-chart-shadow, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                    transition: all 0.3s ease;
                    font-family: var(--wc-chart-font, 'Inter', sans-serif);
                    color: var(--wc-chart-text-color, #334155);
                    line-height: 1.6;
                    font-size: 1.1rem;
                }
                .exp-card b {
                    color: var(--wc-chart-highlight-color, #2563eb);
                    font-weight: 700;
                }
            </style>
            <div class="exp-card" id="output"></div>
        `;
        this.updateView();
    }

    updateView() {
        const expression = this.el.getAttribute('template') || '';
        if (!expression) return;
        
        let result = expression;
        
        // Pega todos os atributos do node atual pra usar de contexto (ex: lucro="50" taxa="2")
        const attributes = this.el.attributes;
        
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            // Regex to replace all occurrences of {{attrName}}
            const regex = new RegExp(`\\{\\{\\s*${attr.name}\\s*\\}\\}`, 'g');
            result = result.replace(regex, `<b>${attr.value}</b>`);
        }
        
        const out = this.shadow.getElementById('output');
        if (out) out.innerHTML = result;
    }
}
