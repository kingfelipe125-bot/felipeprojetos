# Ayrton Senna — Sempre Presente

Site-tributo interativo a Ayrton Senna, feito em HTML/CSS/JS puro (sem build
step — abra `index.html` direto ou sirva a pasta com qualquer servidor
estático).

## O que tem

- **Hero animado** com máquina de escrever alternando fatos reais e chuva
  gerada em canvas (referência às vitórias históricas de Senna sob chuva).
- **Linha do tempo** (`#historia`) com revelação animada ao rolar a página e
  uma barra de progresso que "acende" conforme você avança.
- **Garagem** (`#carros`) com os carros de cada equipe (Toleman, Lotus,
  McLaren, Williams) e um **visualizador 360° interativo**: arraste com o
  mouse/dedo para girar o carro por uma sequência de fotos reais.
- **Capacete** (`#capacete`) contando a história do desenho que nunca mudou.
- **Sala de Troféus 3D** (`#sala-trofeus`): um hall em Three.js dividido em 4
  salas temáticas (Ascensão, Lotus, McLaren, Williams & Legado). Arraste para
  olhar ao redor em 360° dentro da sala; use as setas/pontinhos para viajar
  animadamente até a próxima sala (a câmera realmente se move pelo espaço 3D,
  não é um corte nem um slide de imagens).
- **Legado** (`#legado`) com citações reais e o Instituto Ayrton Senna.

## Sobre as fotos — leia antes de publicar

**Nenhuma foto de Senna, dos carros ou dos troféus foi criada/gerada por IA
neste site.** Todas as molduras de foto começam vazias, mostrando um aviso
com o caminho exato do arquivo esperado (ex: "ADICIONE SUA FOTO AQUI —
images/carros/mclaren/mclaren-mp4-4.jpg"). Assim que você adiciona o arquivo
real nesse caminho, ele passa a aparecer automaticamente — não precisa mexer
em nenhum código.

Veja **`images/MANIFEST.md`** para a lista completa de arquivos esperados,
com descrição e proporção recomendada de cada um, além de sugestões de onde
buscar fotos reais licenciadas (arquivo pessoal, banco de imagens pago,
Wikimedia Commons com licença verificada, Instituto Ayrton Senna).

## Estrutura

```
senna/
├── index.html
├── css/style.css
├── js/
│   ├── main.js            (nav, timeline, chuva, viewer 360°)
│   ├── trophy-room.js      (sala de troféus em Three.js)
│   └── image-fallback.js   (detecta fotos reais e as exibe automaticamente)
├── images/
│   ├── MANIFEST.md         (lista de arquivos de foto esperados)
│   ├── carros/{toleman,lotus,mclaren,williams}/
│   ├── capacete/
│   ├── trofeus/
│   ├── senna/
│   └── 360/mclaren-mp4-4/  (sequência de 36 fotos para o viewer 360°)
└── README.md
```

## Requisitos técnicos

- A sala 3D usa [Three.js](https://threejs.org) via CDN (jsDelivr). Requer
  conexão com a internet na primeira visita (o navegador cacheia depois). Se
  o carregamento falhar, o site avisa na própria sala e o resto da página
  continua funcionando normalmente.
- Sem dependências de build — é só HTML/CSS/JS servido estaticamente.
- Respeita `prefers-reduced-motion` (reduz partículas/animações para quem
  configurou isso no sistema).
