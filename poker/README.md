# Poker Night — Texas Hold'em com moedas virtuais

Jogo de Texas Hold'em No-Limit para **entretenimento**, jogado no navegador contra 5 bots.

> **Moedas virtuais — sem valor real.** Não existem compras, depósitos, saques, PIX, cartão
> ou qualquer forma de converter moedas em dinheiro ou prêmios. Todos os dados ficam no
> `localStorage` do navegador; não há servidor nem APIs externas.

## Rodar localmente

```bash
cd poker
npm install
npm run dev        # http://localhost:3000
npm test           # 32 testes do motor, avaliador de mãos, IA e moedas
npm run build      # gera o site estático em poker/out/
npm run preview    # serve poker/out/ localmente
```

## Publicar

O build é 100% estático (`output: "export"`), então funciona em qualquer hospedagem de arquivos.

- **GitHub Pages:** o site deste repositório é servido pela branch `gh-pages`. O workflow
  `.github/workflows/poker-pages.yml` roda os testes, compila e atualiza **somente** a pasta
  `gh-pages/poker/` a cada push na `main` que altere `poker/`. Endereço:
  https://kingfelipe125-bot.github.io/felipeprojetos/poker/
- **Outra hospedagem em subpasta:** `BASE_PATH=/minha/pasta npm run build`.
- **Netlify / Vercel / Cloudflare Pages:** diretório base `poker`, comando `npm run build`, saída `out`.

## O que está implementado

- Baralho de 52 cartas, embaralhamento Fisher–Yates com RNG criptográfico, queima de cartas.
- Small/big blind (incluindo regra de heads-up), botão rotativo, pré-flop, flop, turn, river, showdown.
- Fold, check, call, bet/raise (com aumento mínimo correto) e all-in.
- All-in menor que um aumento mínimo **não reabre** a ação para quem já agiu.
- Devolução de aposta não paga, potes laterais, divisão de pote e ficha ímpar para o primeiro à esquerda do botão.
- Avaliação das 10 categorias de mão com desempate por kickers (melhor mão de 5 entre 7 cartas).
- 5 bots com personalidades distintas (conservador, agressivo, equilibrado, imprevisível, muito agressivo):
  força pré-flop pela fórmula de Chen; pós-flop, equidade por simulação Monte Carlo contra os oponentes
  restantes, odds do pote, posição e pressão das apostas.
- Carteira com 10.000 moedas iniciais, buy-in/recompra, moedas grátis quando o saldo fica abaixo de 2.000,
  histórico de ganhos e perdas, estatísticas e persistência no navegador.
- Responsivo: mesa horizontal no computador e vertical no celular.

## Estrutura

```
src/lib/poker/        Regras do jogo (sem React)
  cards.ts            Cartas e utilitários
  deck.ts             Baralho, embaralhamento, RNG com semente para testes
  handEvaluator.ts    Avaliação de mãos e desempates
  pots.ts             Pote principal, potes laterais e divisão
  engine.ts           Estado da partida: blinds, turnos, ações, ruas, showdown
  equity.ts           Monte Carlo e fórmula de Chen
  personalities.ts    Perfis dos bots
  ai.ts               Decisão dos bots
src/lib/economy/      Moedas virtuais, estatísticas, mesas e localStorage
src/state/            Ligação com o React (provider de moedas, hook que conduz a mesa)
src/components/       Componentes visuais (mesa, cartas, fichas, barra de ações…)
src/app/              Páginas: menu, lobby, mesa, como jogar, estatísticas
tests/                Testes (node:test via tsx)
```

## Limitações conhecidas

- Os bots são heurísticos, não uma estratégia ótima (GTO). Jogadores experientes vão achar padrões.
- Fechar a aba no meio de uma mão equivale a desistir: as fichas que já estavam no pote se perdem,
  o restante volta para a carteira na próxima visita.
- Abrir o jogo em duas abas ao mesmo tempo não é suportado (a última aba a salvar prevalece).
