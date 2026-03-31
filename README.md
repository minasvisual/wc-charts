# WC Charts Kit

Um Web Component robusto e orientado a componentes para adicionar gráficos interativos `Chart.js` em qualquer framework (ou Vanilla JS) com zero dependências empacotadas. A arquitetura segue de perto as diretrizes de escalabilidade do `wc-forms-kit`.

## 🚀 Instalação e Uso
O componente não necessita de node modules ou bundlers para uso básico. Basta importar a biblioteca via script e registrar os módulos no HTML.

```html
<!-- Carregamento do Chart.JS puro, via cdn local/hosteado -->
<script src="chart.umd.js"></script>
<!-- Importação inicializador do Web Component via ESModules -->
<script type="module" src="wc-chart.js"></script>

<!-- Renderização declarativa -->
<wc-chart 
    type="bar" 
    label="Vendas 2026"
    x='["Jan", "Fev", "Mar"]' 
    y='[1200, 1900, 3000]'>
</wc-chart>
```

## 🎨 Customização Visual via CSS Variables
Os estilos podem ser declarados usando variáveis CSS na classe wrapper ou diretamente em `:root`.

Variáveis suportadas:
* `--wc-chart-bg`: Cor de fundo do chart (padrão: `#ffffff`)
* `--wc-chart-height`: Altura contendo o diagrama (padrão: `400px`)
* `--wc-chart-padding`: Margem interna (padrão: `1.5rem`)
* `--wc-chart-radius`: Arredondamento da view (padrão: `16px`)
* `--wc-chart-shadow`: Sombras da base (padrão: sombra leve)
* `--wc-chart-hover-shadow`: Sombra quando existe estado *hover*

Exemplo:
```css
wc-chart {
    --wc-chart-bg: #1e293b; /* Dark mode card */
    --wc-chart-height: 500px;
}
```

## 🔌 Arquitetura: Estendendo Novos Gráficos
Para criar e registrar nativamente motores de renderização complexos, a lógica deve exportar uma Classe que respeite a inicialização da API do construtor:

```javascript
import { Config, WcChart } from './wc-chart.js';

class RadarChart {
    constructor({ el, shadow, emitEvent }) {
        this.el = el;
        this.shadow = shadow;
        this.emitEvent = emitEvent;
        
        // 1. Cria o contêiner e o Canvas no Shadow DOM
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
        
        // 2. Aguarda a montagem do template para renderizar o gráfico
        setTimeout(() => this.initChart(), 0);
    }

    // Parseia os arrays em JSON que vem do HTML via atributos
    getParams() {
        try {
            return {
                x: JSON.parse(this.el.getAttribute('x') || '[]'),
                y: JSON.parse(this.el.getAttribute('y') || '[]'),
                label: this.el.getAttribute('label') || 'Dados Radar'
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

    // 3. Atualiza os dados de forma reativa quando os atributos do elemento HTML mudam
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

Para usar o seu gráfico, basta enviar o atributo type igual o qual você usou para registrá-lo: `<wc-chart type="radar"></wc-chart>`.

## ⚡ Eventos Nativos
Você pode "escutar" os estágios da biblioteca usando eventos nativos do DOM:
* `@before-mount` - Antes do Canvas ser desenhado no DOM
* `@after-mount` - Assim que a engine de rendering desenhou o gráfico (detalhes do evento entregam `{ instance }`)
* `@updated` - Sempre que um novo valor foi enviado nos atributos e o componente reagiu
* `@click` - Quando uma área do gráfico/view for clicada

```javascript
document.querySelector('#meu-grafico').addEventListener('updated', (e) => {
    console.log('Componente atualizou o atributo', e.detail.attribute);
});
```

## 🧮 ChartDataHelper (Estilo Pandas/Dataframe)
Incluso na biblioteca, criamos um utilitário exclusivo em JS inspirado na praticidade do *Pandas (Python)* para filtrar, ordenar e formatar bancos de dados puros antes de injetá-los no Web Component.

Ele suporta "Dot-Notation" para acessar propriedades dentro de objetos aninhados (ex: `address.street`) nativamente:

```javascript
import { ChartDataHelper } from './wc-chart.js';

// 1. Instancie sua collection nativa
const resultDataset = new ChartDataHelper(mockApiData)
    // 2. Filtre elementos dinamicamente (query) com operadores clássicos
    .query('meta.status', '==', 'active') 
    .query('price', '>', 50)
    
    // 3. Ordene a fonte de dados (sortValues) - true = ascendente / false = decrescente
    .sortValues('meta.barcode', false) 
    
    // 4. Agrupe ou Some um campo em relação ao outro
    .sumBy('category.id', 'price') // Agrupa ID da categoria com o R$ Total Arrecadado
    
    // 5. Formatar converte o resultado final num Payload seguro de envio JSON Arrays dos Extremos X/Y
    .format();

// resultDataset irá entregar: { x: '["Eletrônicos", "Moda"]', y: '[1500, 300]' }
// Pronto para: elemento.setAttribute('x', resultDataset.x);
```

### 📚 API e Tabela de Métodos (`ChartDataHelper`)

Todos os métodos que dependem de chaves de objetos natos suportam **"Dot-Notation"** como argumento (ex: `user.meta.age`).

| Método | Retorno | Descrição | Exemplo de Uso |
|:---|:---:|:---|:---|
| `.query(field, op, val)` | `this` | Filtra a collection preservando os dados. Operadores: `==, !=, >, <, >=, <=, in, not in, contains`. Também suporta *arrow function* como custom condition. | `.query('price', '>', 50)` ou `.query('age', v => v > 18)` |
| `.sortValues(field, asc)` | `this` | Reordena a collection baseada num campo primitivo. O segundo param dita `true` (Crescente) ou `false` (Decrescente). | `.sortValues('meta.date', false)` |
| `.groupBy(field)` | `this` | Agrupa objetos com os mesmos valores de uma chave e guarda uma gaveta deles (gera barras de *Volume/Length* absolutos na mesma linha base). | `.groupBy('category.id')` |
| `.countBy(field)` | `this` | Semelhante ao groupBy, porém consolida o registro somando +1 à quantidade num dicionário embutido. | `.countBy('status')` |
| `.sumBy(group, sum)` | `this` | Agrupa toda a coleção utilizando `group`, mas ao invés de contar os items na barra cumulativa, soma os valores do target em `sum` (Caso `sum` seja numérico em um node, adiciona esse valor ao grupo, se for string ou der problema, faz fall-back para contagem unitária de `1` item). | `.sumBy('mes', 'financeiro.lucro')` |
| `.extractBy(field)` | `this` | Destrói os objetos de toda a matriz e gera um Array estático unilateral extraindo todas as referências do campo `field` puro (ideal para graficos Scatter ou lineares sequenciais simples). | `.extractBy('email')` |
| `.rangeBy(field, ranges)` | `this` | Separa dados baseados numa Array de configurações/limites preestabelecidos com as tags `{ label, min, max }`. Suporta `Date` ou `Float/Int`. Ignora Ranges não definidos aglomerando num field *"Fora da Faixa"*. | `.rangeBy('age', [{label: 'Jovens', min: 0, max: 20}])` |
| `.getCount()` | `Number` | Função de observação. Retorna o montante total de eixos capturados/filtrados/criados geradas após os parses atuais de extração (como as chaves consolidadas). | `.getCount()` |
| `.format()` | `JSON` | Fator final que engloba tudo, stringificando a arquitetura pra ser aceita via atribuição em Web Components: `{ x: '["A", "B"]', y: '[10, 20]' }`. Ele extrai e aplica a função `.getLabels()` pra emascular as labels X da array final. | `.format()` |

___
**Inspirado em Next.js Web Components Design e Vanilla JS Scalable Code.**
