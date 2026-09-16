# Blackjack 21 (local)

Jogo de Blackjack em HTML/CSS/JS puro, sem backend e sem dinheiro real — só moedinhas fictícias do jogo. Você começa com 100 moedas, aposta de 10 em 10, e o saldo fica salvo no navegador (`localStorage`) entre sessões.

## Jogar online

https://kingfelipe125-bot.github.io/felipeprojetos/

## Como rodar

Não precisa de instalação nem servidor. Basta abrir o arquivo direto no navegador:

```
blackjack/index.html
```

Se preferir servir localmente (opcional):

```bash
cd blackjack
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Regras

- Você começa com **100 moedas**.
- Apostas variam de **10 em 10** (mínimo 10, máximo o seu saldo).
- Blackjack (21 com 2 cartas) paga 1.5x a aposta.
- Vitória normal paga 1x a aposta; empate devolve a aposta; derrota perde a aposta.
- Dealer compra carta até somar 17 ou mais.
- Botão **Dobrar** dobra a aposta e compra só mais 1 carta (precisa ter saldo suficiente).
- Botão **Reiniciar** apaga o progresso salvo e volta o saldo para 100 moedas.

Sem saldo suficiente para apostar, o único botão disponível é o de reiniciar.
