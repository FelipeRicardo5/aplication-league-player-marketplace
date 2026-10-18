import { test, expect, type Page } from '@playwright/test';

async function navigateTo(page: Page, path: string) {
  const mobileMenuBtn = page.getByLabel('Abrir menu de navegação');
  if (await mobileMenuBtn.isVisible()) {
    await mobileMenuBtn.click();
    await page.waitForTimeout(300); // aguarda animação da gaveta (sheet)
  }
  await page.locator(`a[href="${path}"]`).first().click();
}

test.describe('Marketplace da Liga - Fluxos Principais E2E', () => {
  test('Fluxo 1: Navegação principal, layout e responsividade', async ({ page }) => {
    // 1. Acessar a raiz da aplicação - deve redirecionar para /players
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/players/);

    // 2. Verificar presença do logotipo/marca "Passe"
    await expect(page.locator('text=Passe').first()).toBeVisible();

    // 3. Navegar para a página de Clubes
    await navigateTo(page, '/clubs');
    await expect(page).toHaveURL(/.*\/clubs/);
    await expect(page.locator('h1')).toContainText('Clubes da Liga');

    // 4. Navegar para Partidas
    await navigateTo(page, '/matches');
    await expect(page).toHaveURL(/.*\/matches/);
    await expect(page.locator('h1')).toContainText('Partidas');

    // 5. Navegar para Classificação
    await navigateTo(page, '/standings');
    await expect(page).toHaveURL(/.*\/standings/);
    await expect(page.locator('h1')).toContainText('Classificação da Liga');
  });

  test('Fluxo 2: Cadastro de jogador e validação de formulário', async ({ page }) => {
    await page.goto('/players');

    // Abrir modal de cadastro
    const newPlayerBtn = page.getByRole('button', { name: /Cadastrar Jogador/i });
    await expect(newPlayerBtn).toBeVisible();
    await newPlayerBtn.click();

    // Validar abertura do diálogo
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cadastrar Novo Jogador' })).toBeVisible();

    // Tentar salvar com campos vazios para acionar validação declarativa do formulário
    const submitBtn = page.getByRole('button', { name: 'Salvar Jogador' });
    await submitBtn.click();

    // Verificar mensagens de erro de validação
    await expect(page.locator('text=O nome é obrigatório')).toBeVisible();

    // Preencher nome com apenas 1 palavra
    const nameInput = page.locator('#create-name');
    await nameInput.fill('Neymar');
    await submitBtn.click();
    await expect(page.locator('text=O nome deve ter pelo menos duas palavras')).toBeVisible();

    // Preencher dados válidos do jogador
    const uniqueSuffix = Date.now().toString().slice(-4);
    const validPlayerName = `Lucas Silva ${uniqueSuffix}`;
    await nameInput.fill(validPlayerName);

    // Preencher idade
    const ageInput = page.locator('#create-age');
    await ageInput.fill('24');

    // Preencher atributos respeitando o limite máximo de soma 480
    await page.locator('#create-pace').fill('75');
    await page.locator('#create-shooting').fill('70');
    await page.locator('#create-passing').fill('75');
    await page.locator('#create-dribbling').fill('75');
    await page.locator('#create-defending').fill('60');
    await page.locator('#create-physical').fill('70');
    await page.locator('#create-agility').fill('80');
    await page.locator('#create-potential').fill('80');

    // Submeter formulário válido
    await submitBtn.click();

    // Modal deve fechar e jogador deve aparecer na listagem
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${validPlayerName}`)).toBeVisible({ timeout: 10000 });
  });

  test('Fluxo 3: Criação de clube e validação da sigla', async ({ page }) => {
    await page.goto('/clubs');

    // Abrir modal de criação de clube
    const newClubBtn = page.getByRole('button', { name: /Novo Clube/i });
    await newClubBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cadastrar Novo Clube' })).toBeVisible();

    const nameInput = page.locator('#club-name');
    const acronymInput = page.locator('#club-acronym');
    const submitBtn = page.getByRole('button', { name: 'Fundar Clube' });

    // Tentar sigla que não combina com as letras do clube
    await nameInput.fill('Sport Club Recife');
    await acronymInput.fill('XYZ');
    await submitBtn.click();

    await expect(
      page.locator('text=A sigla deve iniciar com a primeira letra do clube'),
    ).toBeVisible();

    // Preencher com sigla e nome válidos únicos
    const uniqueLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
    const uniqueClubName = `Sport Club ${uniqueLetter}ecife`;
    const uniqueAcronym = `SC${uniqueLetter}`;
    await nameInput.fill(uniqueClubName);
    await acronymInput.fill(uniqueAcronym);
    await submitBtn.click();

    // Modal fecha após criação
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });
  });

  test('Fluxo 4: Visualização de detalhes do clube, abas e histórico financeiro', async ({
    page,
  }) => {
    await page.goto('/clubs');

    // Se houver algum clube listado, clicar no primeiro card
    const firstClubLink = page.locator('a[href^="/clubs/"]').first();
    if (await firstClubLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstClubLink.click();
      await expect(page).toHaveURL(/.*\/clubs\/\d+/);

      // Verificar presença das 3 abas
      await expect(page.getByRole('tab', { name: /Elenco/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Escalação Tática/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /Extrato Financeiro/i })).toBeVisible();

      // Clicar na aba Extrato Financeiro
      await page.getByRole('tab', { name: /Extrato Financeiro/i }).click();
      await expect(page.getByRole('button', { name: /Exportar CSV/i })).toBeVisible();

      // Clicar na aba Escalação Tática
      await page.getByRole('tab', { name: /Escalação Tática/i }).click();
      await expect(page.locator('text=Formação Tática')).toBeVisible();
    }
  });

  test('Fluxo 5: Tratamento de conflito de negócio (409) na API', async ({ page }) => {
    await page.goto('/players');

    // Interceptar uma requisição e simular retorno 409 de conflito de regra de negócio da API
    await page.route('**/api/v1/players', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Já existe um jogador cadastrado com este mesmo nome na base de dados.',
          }),
        });
      } else {
        await route.continue();
      }
    });

    // Abrir modal e submeter
    await page.getByRole('button', { name: /Cadastrar Jogador/i }).click();
    await page.locator('#create-name').fill('Jogador Conflito');
    await page.locator('#create-age').fill('20');
    await page.locator('#create-pace').fill('70');
    await page.locator('#create-shooting').fill('70');
    await page.locator('#create-passing').fill('70');
    await page.locator('#create-dribbling').fill('70');
    await page.locator('#create-defending').fill('70');
    await page.locator('#create-physical').fill('70');
    await page.locator('#create-agility').fill('70');
    await page.locator('#create-potential').fill('70');

    await page.getByRole('button', { name: 'Salvar Jogador' }).click();

    // Deve exibir o Toast de erro com a mensagem 409 vinda da API
    await expect(
      page.locator('text=Já existe um jogador cadastrado com este mesmo nome'),
    ).toBeVisible({ timeout: 5000 });
  });
});
