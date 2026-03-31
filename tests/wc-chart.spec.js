import { test, expect } from '@playwright/test';

test.describe('WC-Chart Interface Validation', () => {
    test.beforeEach(async ({ page }) => {
        // Acessa o live index local
        await page.goto('http://localhost:3000');
    });

    test('deve renderizar o container do web-component corretamente', async ({ page }) => {
        const barChart = page.locator('wc-chart#bar-chart');
        await expect(barChart).toBeVisible();
    });

    test('deve inflar o shadow DOM com um chart-container e canvas', async ({ page }) => {
        const barChart = page.locator('wc-chart#bar-chart');
        
        // Verifica se atravessou e injetou as tags corretas internamente
        const container = barChart.locator('.chart-container');
        await expect(container).toBeVisible();

        const canvas = barChart.locator('canvas');
        await expect(canvas).toBeVisible();
    });

    test('atributos especiais do chart Stats devem popular os paineis em HTML puro do text template', async ({ page }) => {
        const statChart = page.locator('wc-chart[type="stats"]');
        await expect(statChart).toBeVisible();

        const statValue = statChart.locator('#val');
        const statLabel = statChart.locator('#lbl');
        const statDesc = statChart.locator('#desc');

        // Valores mapeados no index.html
        await expect(statValue).toHaveText('42.5K');
        await expect(statLabel).toHaveText('Usuários Ativos Únicos');
        await expect(statDesc).toHaveText('Aumento de +15.5% em relação ao mês anterior.');

        // Testar reatividade: Mudar atributo via javascript forçado e ver se a tela reflete instantâneo
        await statChart.evaluate((node) => node.setAttribute('value', '100K'));
        await expect(statValue).toHaveText('100K');
    });

    test('template expressions reagem e compilam bindings e dots textuais', async ({ page }) => {
        const expChart = page.locator('wc-chart[type="expression"]');
        await expect(expChart).toBeVisible();

        const outputHTML = await expChart.locator('#output').innerHTML();
        expect(outputHTML).toContain('<b>Marketing</b>');
        expect(outputHTML).toContain('<b>R$ 15.000</b>');
        expect(outputHTML).toContain('<b>25.4%</b>');
    });

    test('gráfico consumindo api externa (dummyjson) injeta valores formatados no array', async ({ page }) => {
        const apiChart = page.locator('wc-chart#api-bar-chart');
        await expect(apiChart).toBeVisible();

        // O Fetch async deve injetar valores maiores que [] no atributo 'x' após carregamento
        await expect(apiChart).not.toHaveAttribute('x', '[]');
        // Confirmar que processou strings
        const xAttr = await apiChart.getAttribute('x');
        expect(xAttr.length).toBeGreaterThan(5); 
        expect(xAttr.includes('["Beauty"')).toBeTruthy();
    });
});
