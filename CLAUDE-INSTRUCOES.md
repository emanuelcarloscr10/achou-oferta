# Achou Oferta — instruções para Claude

## Objetivo
Este é um site estático de curadoria de ofertas com links de afiliado. A compra ocorre na loja parceira (ex.: Mercado Livre).

## Arquivos principais
- `index.html`: página pública.
- `style.css`: layout e identidade visual.
- `products.js`: catálogo público. **Para inserir ofertas, prefira editar este arquivo.**
- `script.js`: busca, filtros, ordenação e renderização.
- `admin.html` / `admin.js`: painel local para rascunhar/importar/exportar produtos. Alterações nele ficam no navegador até serem incorporadas ao `products.js` e publicadas.
- `identidade.png` e `painel-identidade.png`: referências visuais do projeto.

## Regra mais importante
Não invente preço, desconto, avaliação, número de vendas, imagem ou link. Use apenas dados efetivamente visíveis na página do produto/central de afiliados. Antes de publicar, confirme que o link de afiliado aponta para o produto correto.

## Fluxo sugerido
1. Usar Claude in Chrome na Central de Afiliados do Mercado Livre.
2. Encontrar produtos conforme os critérios definidos pelo usuário.
3. Gerar/copiar o link de afiliado de cada produto.
4. Obter nome, preço atual, preço anterior apenas se exibido, URL de imagem permitida e categoria.
5. Atualizar `products.js`, removendo gradualmente os itens `isDemo: true`.
6. Testar o site localmente/preview.
7. Conferir todos os botões “Ver oferta”.
8. Fazer commit/deploy apenas depois da revisão.

## Estrutura de produto
```js
{
  id: "mercadolivre-mlb123456789",
  name: "Nome exato e claro do produto",
  category: "Celulares",
  store: "Mercado Livre",
  price: 1999.90,
  oldPrice: 2299.90, // null quando não houver preço anterior confirmado
  image: "https://...",
  emoji: "📱",
  link: "https://...link-de-afiliado...",
  featured: true,
  isDemo: false,
  createdAt: "2026-09-15T18:00:00-03:00"
}
```

## Categorias desejadas inicialmente
- Casa e eletrodomésticos
- TVs
- Celulares
- Tênis
- Roupa de academia / Moda fitness
- Eletrônicos
- Livros
- Notebooks
- Ferramentas

## Critérios de curadoria
Priorizar, quando os dados estiverem disponíveis:
- boa reputação do vendedor;
- avaliações favoráveis;
- volume relevante de vendas;
- preço competitivo;
- oferta clara;
- produto com boa apresentação;
- estoque aparentemente disponível.

Não alegar que algo é “o melhor preço da internet” sem pesquisa comparativa suficiente.

## Transparência
Manter o aviso de afiliados e o aviso de que preços, estoque e frete podem mudar.
