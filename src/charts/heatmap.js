export class ChartHeatmap {
    constructor({ el, shadow }) {
        this.el = el;
        this.shadow = shadow;
        this.renderTemplate();
    }

    onAttributeChanged(name, oldValue, newValue) {
        if (oldValue !== newValue) this.updateView();
    }

    parseData(attrValue) {
        try { return JSON.parse(attrValue); } catch { return []; }
    }

    getParams() {
        const xRows = this.parseData(this.el.getAttribute('x'));
        const yCols = this.parseData(this.el.getAttribute('y'));
        const values = this.parseData(this.el.getAttribute('data'));
        
        // Cor base do heatmap (hsl para manipulação de luminosidade simples)
        // Hue = Hue(0=red, 120=green, 240=blue, etc). Ex: --wc-chart-hue: 240;
        const colorHue = this.el.getAttribute('hue') || '220'; 
        return { xRows, yCols, values, colorHue };
    }

    renderTemplate() {
        this.shadow.innerHTML = `
            <style>
                .heatmap-container {
                    padding: var(--wc-chart-padding, 1.5rem);
                    background: var(--wc-chart-bg, #ffffff);
                    border-radius: var(--wc-chart-radius, 16px);
                    box-shadow: var(--wc-chart-shadow, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    font-family: var(--wc-chart-font, 'Inter', sans-serif);
                    overflow-x: auto;
                }
                .heatmap-row {
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }
                .heatmap-label {
                    min-width: 80px;
                    font-size: 0.8rem;
                    color: #64748b;
                    text-align: right;
                    padding-right: 8px;
                }
                .heatmap-cell {
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    transition: transform 0.2s;
                    cursor: crosshair;
                }
                .heatmap-cell:hover {
                    transform: scale(1.1);
                    z-index: 2;
                    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
                }
                .heatmap-header {
                    display: flex;
                    gap: 4px;
                    align-items: flex-end;
                    padding-left: 88px; /* label width + padding */
                }
                .heatmap-col-label {
                    width: 40px;
                    font-size: 0.75rem;
                    color: #64748b;
                    text-align: center;
                    transform: rotate(-45deg);
                    transform-origin: left bottom;
                }
            </style>
            <div class="heatmap-container" id="grid">
                <!-- Construído Dinâmicamente -->
            </div>
        `;
        this.updateView();
    }

    updateView() {
        const { xRows, yCols, values, colorHue } = this.getParams();
        const grid = this.shadow.getElementById('grid');
        if (!grid || xRows.length === 0 || yCols.length === 0) return;

        let maxVal = Math.max(...values);
        let minVal = Math.min(...values);

        let html = '<div class="heatmap-header">';
        yCols.forEach(col => {
            html += `<div class="heatmap-col-label">${col}</div>`;
        });
        html += '</div>';

        let valIndex = 0;
        for (let i = 0; i < xRows.length; i++) {
            html += '<div class="heatmap-row">';
            html += `<div class="heatmap-label">${xRows[i]}</div>`;
            
            for (let j = 0; j < yCols.length; j++) {
                let v = values[valIndex] || 0;
                
                // Normaliza valor pra intensidade
                let intensity = maxVal === minVal ? 0.5 : (v - minVal) / (maxVal - minVal);
                // Calcula Luminosity no HSL: 95% (claro) to 40% (escuro)
                let lum = 95 - (intensity * 55); 
                let textColor = lum < 60 ? '#ffffff' : '#1e293b';

                html += `<div class="heatmap-cell" 
                              title="Row: ${xRows[i]} | Col: ${yCols[j]} | Val: ${v}"
                              style="background-color: hsl(${colorHue}, 80%, ${lum}%); color: ${textColor};">
                              ${v.toFixed(1)}
                         </div>`;
                valIndex++;
            }
            html += '</div>';
        }

        grid.innerHTML = html;
    }
}
