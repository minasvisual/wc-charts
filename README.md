# WC Charts Kit

A robust and component-oriented Web Component to add interactive `Chart.js` charts in any framework (or Vanilla JS) with zero bundled dependencies. The architecture closely follows the scalability guidelines of `wc-forms-kit`.

## 🚀 Installation and Usage
The component doesn't require node modules, bundlers, or CDNs for basic usage. Just import the library via script and register the module in your HTML. **Chart.js is dynamically auto-injected under the hood**, providing full Server-Side Rendering (SSR) safety for Next.js users.

```html
<!-- Web Component Initialization via ESModules -->
<script type="module" src="wc-chart.js"></script>

<!-- Declarative Rendering -->
<wc-chart 
    type="bar" 
    label="2026 Sales"
    x='["Jan", "Feb", "Mar"]' 
    y='[1200, 1900, 3000]'>
</wc-chart>
```

## 🎨 Visual Customization via CSS Variables
Styles can be declared using CSS variables on the wrapper class or directly in `:root`.

Supported variables:
* `--wc-chart-bg`: Chart background color (default: `#ffffff`)
* `--wc-chart-height`: Height enclosing the diagram (default: `400px`)
* `--wc-chart-padding`: Internal padding (default: `1.5rem`)
* `--wc-chart-radius`: Border radius of the view (default: `16px`)
* `--wc-chart-shadow`: Base shadows (default: soft shadow)
* `--wc-chart-hover-shadow`: Shadow when in *hover* state

Example:
```css
wc-chart {
    --wc-chart-bg: #1e293b; /* Dark mode card */
    --wc-chart-height: 500px;
}
```

## 🔌 Architecture: Extending New Charts
To build and natively register complex render engines, the logic must export a Class that respects the constructor API initialization:

```javascript
import { Config, WcChart } from './wc-chart.js';

class RadarChart {
    constructor({ el, shadow, emitEvent }) {
        this.el = el;
        this.shadow = shadow;
        this.emitEvent = emitEvent;
        
        // 1. Creates the container and Canvas inside the Shadow DOM
        this.shadow.innerHTML = `
            <style>
                .chart-container {
                    position: relative;
                    height: var(--wc-chart-height, 400px);
                    width: 100%;
                }
                canvas { display: block; }
            </style>
            <div class="chart-container"><canvas></canvas></div>
        `;
        
        // 2. Waits for the template to mount before rendering the chart
        setTimeout(() => this.initChart(), 0);
    }

    // Parses JSON arrays that come from HTML attributes
    getParams() {
        try {
            return {
                x: JSON.parse(this.el.getAttribute('x') || '[]'),
                y: JSON.parse(this.el.getAttribute('y') || '[]'),
                label: this.el.getAttribute('label') || 'Radar Data'
            };
        } catch {
            return { x: [], y: [], label: '' };
        }
    }

    initChart() {
        const canvas = this.shadow.querySelector('canvas');
        if (!canvas || typeof Chart === 'undefined') return;

        const { x, y, label } = this.getParams();

        this.chartInstance = new Chart(canvas.getContext('2d'), {
            type: 'radar',
            data: {
                labels: x,
                datasets: [{
                    label: label,
                    data: y,
                    backgroundColor: 'rgba(54, 162, 235, 0.4)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 3. Reactively updates data when HTML element attributes mutate
    onAttributeChanged(name, oldValue, newValue) {
        if (oldValue !== newValue && this.chartInstance) {
            const { x, y, label } = this.getParams();
            this.chartInstance.data.labels = x;
            this.chartInstance.data.datasets[0].data = y;
            this.chartInstance.data.datasets[0].label = label;
            this.chartInstance.update();
        }
    }
}

Config.registerChart('radar', RadarChart);
```

To use your chart, simply pass the `type` attribute equal to what you used to register it: `<wc-chart type="radar"></wc-chart>`.

## ⚡ Native Events
You can "listen" to the library stages using native DOM events:
* `@before-mount` - Intercepted before the Canvas is drawn to the DOM
* `@after-mount` - As soon as the rendering engine has drawn the chart (event details provide `{ instance }`)
* `@updated` - Whenever a new value is sent via attributes and the component reacts
* `@click` - When a specific area of the chart/view is clicked

```javascript
document.querySelector('#my-chart').addEventListener('updated', (e) => {
    console.log('Component updated its attribute:', e.detail.attribute);
});
```

## 🧮 ChartDataHelper (Pandas/Dataframe Style)
Included in the library, there is a dedicated Javascript utility heavily inspired by the seamless developer experience of *Pandas (Python)* to filter, sort and format pure raw datasets before injecting them into the Web Component.

It supports "Dot-Notation" to natively access deep/nested object properties (e.g. `address.street`):

```javascript
import { ChartDataHelper } from './wc-chart.js';

// 1. Instantiate your native collection
const resultDataset = new ChartDataHelper(mockApiData)
    // 2. Dynamically filter elements (query) with classic operators
    .query('meta.status', '==', 'active') 
    .query('price', '>', 50)
    
    // 3. Sort the data source (sortValues) - true = ascending / false = descending
    .sortValues('meta.barcode', false) 
    
    // 4. Group or Sum a field relative to another
    .sumBy('category.id', 'price') // Groups Category ID alongside the Total Revenue gathered
    
    // 5. Format converts the final outcome into a secure stringified JSON Payload of X/Y Arrays
    .format();

// resultDataset will output: { x: '["Electronics", "Fashion"]', y: '[1500, 300]' }
// Ready for: myElement.setAttribute('x', resultDataset.x);
```

### 📚 API and Methods Table (`ChartDataHelper`)

All methods dealing with native data keys support **"Dot-Notation"** natively (ex: `user.meta.age`).

| Method | Returns | Description | Usage Example |
|:---|:---:|:---|:---|
| `.query(field, op, val)` | `this` | Filters the collection while preserving the objects natively. Available operators: `==, !=, >, <, >=, <=, in, not in, contains`. Also supports an *arrow function* as a custom check. | `.query('price', '>', 50)` or `.query('age', v => v > 18)` |
| `.sortValues(field, asc)` | `this` | Flattens and reorders the collection based on a primitive field. The second parameter dictates `true` (Ascending) or `false` (Descending). | `.sortValues('meta.date', false)` |
| `.groupBy(field)` | `this` | Groups objects holding identically matched keys and stores them in dictionary arrays (generates *Volume/Length* stacked bars over the same baseline scale). | `.groupBy('category.id')` |
| `.countBy(field)` | `this` | Similar to groupBy, but automatically consolidates the records by adding +1 to its dictionary quantity output amount natively. | `.countBy('status')` |
| `.sumBy(group, sum)` | `this` | Groups everything relying on `group`, but instead of bumping +1 over the items array, it precisely sums targeted numerical values from `sum` (If `sum` is numerical, it appends itself into the total; if it is a string or fails parsing, it falls back to a unitary string count of `1`). | `.sumBy('month', 'financial.profit')` |
| `.extractBy(field)` | `this` | Erases collection-level depth and outputs a static 1D Array extracting strictly the `field` references (ideal for Scatter or simple sequential linear traces). | `.extractBy('email')` |
| `.rangeBy(field, ranges)` | `this` | Categorizes chronological/statistical inputs according to a predefined Array bounded by limits `{ label, min, max }`. Supports `Date` objects or `Float/Int` parsing. Bypasses unparsed inputs grouping them into an *"Out of bounds"* bracket. | `.rangeBy('age', [{label: 'Youth', min: 0, max: 20}])` |
| `.getCount()` | `Number` | Observation utility function. Returns the total amount of axes filtered/captured/created after the recent extraction parses. | `.getCount()` |
| `.format()` | `JSON` | Macro closer encompassing the prior manipulations, rendering stringified architectures mapped explicitly for native Web Component attributes: `{ x: '["A", "B"]', y: '[10, 20]' }`. It triggers the `.getLabels()` pipeline abstracting X-axis variables. | `.format()` |

___
**Inspired by Next.js Web Components Design and Vanilla JS Scalable Code.**
