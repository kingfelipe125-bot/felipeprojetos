# Roteiro Nova Iorque — 15 dias

Site estático (sem build, sem dependências) com o roteiro da viagem: 15 dias, os 6 pontos turísticos, 20 restaurantes e 15 hamburguerias em Manhattan e Brooklyn.

## Como ver

Abra `index.html` direto no navegador, ou rode um servidor local:

```bash
cd roteiro-nova-iorque
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

Pra publicar de graça: Settings → Pages no repositório do GitHub, escolha a branch e a pasta `/roteiro-nova-iorque` (ou mova o conteúdo pra raiz de um repo próprio).

## Como adicionar as fotos da viagem

Cada card (ponto turístico, restaurante ou hamburgueria) tenta carregar uma foto de:

```
assets/fotos/nome-do-lugar.jpg
```

O nome do arquivo é o nome do lugar em minúsculo, sem acento, com hífen no lugar de espaço — por exemplo `Le Bernardin` vira `assets/fotos/le-bernardin.jpg`. Se o arquivo não existir, o card mostra uma ilustração no lugar, então nada quebra. Formatos aceitos: qualquer um que o navegador leia (`.jpg` é o que está configurado; pra usar `.png` ou `.webp`, troca a extensão em `script.js`, na função `mediaIllustration`/`placeCard`).

## Como editar o conteúdo

Todos os dados (roteiro dia a dia, pontos turísticos, restaurantes, hamburguerias) estão em `script.js`, no topo do arquivo, em arrays simples de objetos. Não precisa mexer no HTML pra adicionar, remover ou corrigir um lugar.

## Sobre as notas e o status Michelin

Os dados de avaliação, Michelin e endereço foram levantados por pesquisa (agosto de 2026) e marcados como aproximados quando não havia uma fonte 100% oficial disponível. Vale conferir antes de reservar, principalmente pra restaurantes com estrela Michelin.
