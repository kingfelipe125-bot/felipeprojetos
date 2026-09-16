const STORAGE_KEY = 'blackjack-save-v1';
const STARTING_BALANCE = 100;
const BET_STEP = 10;

const SUITS = [
  { symbol: '♠', color: 'black' },
  { symbol: '♣', color: 'black' },
  { symbol: '♥', color: 'red' },
  { symbol: '♦', color: 'red' },
];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const el = {
  balance: document.getElementById('balance'),
  message: document.getElementById('message'),
  dealerCards: document.getElementById('dealer-cards'),
  playerCards: document.getElementById('player-cards'),
  dealerScore: document.getElementById('dealer-score'),
  playerScore: document.getElementById('player-score'),
  betPanel: document.getElementById('bet-panel'),
  actionPanel: document.getElementById('action-panel'),
  nextPanel: document.getElementById('next-panel'),
  betAmount: document.getElementById('bet-amount'),
  dealBtn: document.getElementById('deal-btn'),
  hitBtn: document.getElementById('hit-btn'),
  standBtn: document.getElementById('stand-btn'),
  doubleBtn: document.getElementById('double-btn'),
  nextRoundBtn: document.getElementById('next-round-btn'),
  resetBtn: document.getElementById('reset-btn'),
};

let state = {
  balance: STARTING_BALANCE,
  bet: BET_STEP,
};

let deck = [];
let playerHand = [];
let dealerHand = [];
let roundActive = false;
let currentBet = 0;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (typeof saved.balance === 'number' && saved.balance >= 0) {
        state.balance = saved.balance;
      }
    }
  } catch (e) {
    // localStorage indisponível: segue com saldo padrão
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ balance: state.balance }));
  } catch (e) {
    // ignora falha de armazenamento
  }
}

function createDeck() {
  const d = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      d.push({ rank, suit: suit.symbol, color: suit.color });
    }
  }
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function drawCard() {
  if (deck.length === 0) deck = createDeck();
  return deck.pop();
}

function handValue(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    if (card.rank === 'A') {
      aces += 1;
      total += 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function cardEl(card, hidden) {
  const div = document.createElement('div');
  if (hidden) {
    div.className = 'card back';
    return div;
  }
  div.className = 'card' + (card.color === 'red' ? ' red' : '');
  div.innerHTML = `
    <span class="rank-top">${card.rank}</span>
    <span class="suit-center">${card.suit}</span>
    <span class="rank-bottom">${card.rank}</span>
  `;
  return div;
}

function renderHands(revealDealer) {
  el.playerCards.innerHTML = '';
  playerHand.forEach((c) => el.playerCards.appendChild(cardEl(c, false)));
  el.playerScore.textContent = handValue(playerHand);

  el.dealerCards.innerHTML = '';
  dealerHand.forEach((c, i) => {
    const hide = !revealDealer && i === 1;
    el.dealerCards.appendChild(cardEl(c, hide));
  });
  el.dealerScore.textContent = revealDealer ? handValue(dealerHand) : handValue([dealerHand[0]]);
}

function updateBalanceDisplay() {
  el.balance.textContent = state.balance;
}

function setMessage(text) {
  el.message.textContent = text;
}

function showBetPanel() {
  el.betPanel.classList.remove('hidden');
  el.actionPanel.classList.add('hidden');
  el.nextPanel.classList.add('hidden');
  clampBet();
  el.dealBtn.disabled = state.balance < BET_STEP;
  if (state.balance < BET_STEP) {
    setMessage('Sem moedas suficientes. Clique em Reiniciar para jogar novamente.');
  }
}

function showActionPanel() {
  el.betPanel.classList.add('hidden');
  el.actionPanel.classList.remove('hidden');
  el.nextPanel.classList.add('hidden');
  el.doubleBtn.disabled = state.balance < currentBet * 2;
}

function showNextPanel() {
  el.betPanel.classList.add('hidden');
  el.actionPanel.classList.add('hidden');
  el.nextPanel.classList.remove('hidden');
}

function clampBet() {
  const maxBet = Math.max(BET_STEP, Math.floor(state.balance / BET_STEP) * BET_STEP);
  if (state.bet > maxBet) state.bet = maxBet;
  if (state.bet < BET_STEP) state.bet = BET_STEP;
  el.betAmount.textContent = state.bet;
}

function adjustBet(delta) {
  const next = state.bet + delta;
  if (next < BET_STEP) return;
  if (next > state.balance) return;
  state.bet = next;
  el.betAmount.textContent = state.bet;
}

function startRound() {
  if (state.balance < state.bet) return;
  currentBet = state.bet;
  deck = deck.length < 15 ? createDeck() : deck;
  playerHand = [drawCard(), drawCard()];
  dealerHand = [drawCard(), drawCard()];
  roundActive = true;

  renderHands(false);
  setMessage(`Aposta: ${currentBet} moedas`);
  showActionPanel();

  if (handValue(playerHand) === 21) {
    finishRound();
  }
}

function hit() {
  if (!roundActive) return;
  playerHand.push(drawCard());
  renderHands(false);
  el.doubleBtn.disabled = true;
  if (handValue(playerHand) > 21) {
    finishRound();
  }
}

function doubleDown() {
  if (!roundActive || playerHand.length !== 2 || state.balance < currentBet * 2) return;
  currentBet *= 2;
  playerHand.push(drawCard());
  renderHands(false);
  finishRound();
}

function stand() {
  if (!roundActive) return;
  finishRound();
}

function dealerPlay() {
  while (handValue(dealerHand) < 17) {
    dealerHand.push(drawCard());
  }
}

function finishRound() {
  roundActive = false;
  const playerTotal = handValue(playerHand);

  if (playerTotal <= 21) {
    dealerPlay();
  }
  renderHands(true);

  const dealerTotal = handValue(dealerHand);
  const playerBJ = playerTotal === 21 && playerHand.length === 2;
  const dealerBJ = dealerTotal === 21 && dealerHand.length === 2;

  let resultText;
  let delta;

  if (playerTotal > 21) {
    resultText = `Estourou com ${playerTotal}. Você perdeu ${currentBet} moedas.`;
    delta = -currentBet;
  } else if (playerBJ && !dealerBJ) {
    delta = Math.floor(currentBet * 1.5);
    resultText = `Blackjack! Você ganhou ${delta} moedas.`;
  } else if (dealerBJ && !playerBJ) {
    resultText = `Dealer fez Blackjack. Você perdeu ${currentBet} moedas.`;
    delta = -currentBet;
  } else if (dealerTotal > 21) {
    delta = currentBet;
    resultText = `Dealer estourou com ${dealerTotal}. Você ganhou ${delta} moedas.`;
  } else if (playerTotal > dealerTotal) {
    delta = currentBet;
    resultText = `Você venceu ${playerTotal} x ${dealerTotal}. Ganhou ${delta} moedas.`;
  } else if (playerTotal < dealerTotal) {
    delta = -currentBet;
    resultText = `Dealer venceu ${dealerTotal} x ${playerTotal}. Você perdeu ${currentBet} moedas.`;
  } else {
    delta = 0;
    resultText = `Empate em ${playerTotal}. Aposta devolvida.`;
  }

  state.balance += delta;
  if (state.balance < 0) state.balance = 0;
  updateBalanceDisplay();
  saveState();
  setMessage(resultText);
  showNextPanel();
}

function nextRound() {
  clampBet();
  showBetPanel();
  setMessage(state.balance < BET_STEP ? 'Sem moedas suficientes. Clique em Reiniciar para jogar novamente.' : 'Faça sua aposta para começar');
}

function resetGame() {
  const confirmed = window.confirm('Reiniciar o jogo e voltar para 100 moedas?');
  if (!confirmed) return;
  state.balance = STARTING_BALANCE;
  state.bet = BET_STEP;
  playerHand = [];
  dealerHand = [];
  roundActive = false;
  deck = createDeck();
  el.playerCards.innerHTML = '';
  el.dealerCards.innerHTML = '';
  el.playerScore.textContent = '0';
  el.dealerScore.textContent = '0';
  updateBalanceDisplay();
  saveState();
  showBetPanel();
  setMessage('Saldo reiniciado para 100 moedas. Boa sorte!');
}

document.querySelectorAll('[data-bet]').forEach((btn) => {
  btn.addEventListener('click', () => adjustBet(parseInt(btn.dataset.bet, 10)));
});
el.dealBtn.addEventListener('click', startRound);
el.hitBtn.addEventListener('click', hit);
el.standBtn.addEventListener('click', stand);
el.doubleBtn.addEventListener('click', doubleDown);
el.nextRoundBtn.addEventListener('click', nextRound);
el.resetBtn.addEventListener('click', resetGame);

loadState();
deck = createDeck();
updateBalanceDisplay();
showBetPanel();
