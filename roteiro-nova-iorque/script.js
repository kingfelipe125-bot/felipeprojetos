/* ============================================================
   NY · Roteiro de 15 dias · dados e interações
   ============================================================ */

function slugify(str){
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

/* ---------------- LANDMARKS ---------------- */
const landmarks = [
  {
    name:"Ponte do Brooklyn", icon:"i-bridge", neighborhood:"Manhattan ↔ Brooklyn (DUMBO)",
    blurb:"Atravesse a pé ao entardecer: cabos de aço gigantes, trilhos do metrô embaixo e a skyline se abrindo a cada passo.",
    tip:"Vá cedo pela manhã ou perto do pôr do sol. Ao meio-dia o passeio de pedestres vira um corredor lotado.",
    mapsQuery:"Brooklyn Bridge, New York, NY"
  },
  {
    name:"Times Square", icon:"i-marquee", neighborhood:"Midtown Manhattan",
    blurb:"Néon, telões e o caos mais fotografado do planeta. Melhor experiência à noite, quando os painéis realmente acendem a rua.",
    tip:"Suba até a arquibancada vermelha da TKTS Booth pra ver o movimento de cima, longe do empurra-empurra.",
    mapsQuery:"Times Square, New York, NY"
  },
  {
    name:"Central Park", icon:"i-tree", neighborhood:"Manhattan (Midtown ao Upper)",
    blurb:"340 hectares de verde no meio de arranha-céu, com Bethesda Terrace, Bow Bridge e Strawberry Fields. Dá pra passar o dia inteiro.",
    tip:"Alugue uma bike na entrada da 72nd St e faça o loop completo: é a forma mais rápida de ver o parque de ponta a ponta.",
    mapsQuery:"Central Park, New York, NY"
  },
  {
    name:"Musical da Broadway", icon:"i-star", neighborhood:"Theater District, Midtown",
    blurb:"Uma noite no Theater District é obrigatória: luzes de marquise, tapete vermelho de calçada e o show ao vivo que só Nova York tem.",
    tip:"Compre antecipado pro título que você mais quer, os hits vendem rápido, principalmente sexta e sábado.",
    mapsQuery:"Theater District, New York, NY"
  },
  {
    name:"Empire State Building", icon:"i-building", neighborhood:"Midtown / Herald Square",
    blurb:"O mirante mais icônico da cidade. Do 86º andar dá pra ver Manhattan inteira, e no fim de tarde o show é o pôr do sol.",
    tip:"Reserve o horário do pôr do sol com antecedência: é o ingresso que esgota primeiro.",
    mapsQuery:"Empire State Building, New York, NY"
  },
  {
    name:"Brooklyn (DUMBO & Heights)", icon:"i-boro", neighborhood:"Brooklyn",
    blurb:"Ruas de paralelepípedo, o cartão-postal da Washington St com a Manhattan Bridge ao fundo e a promenade com a melhor vista de Manhattan que existe.",
    tip:"Vá até a Brooklyn Bridge Park no fim do dia: a vista do skyline de Manhattan acendendo as luzes é imperdível.",
    mapsQuery:"DUMBO, Brooklyn, NY"
  }
];

/* ---------------- ITINERARY (15 days) ---------------- */
const itinerary = [
  {tag:"Chegada", title:"Pouso em Nova York", text:"Check-in, primeira volta a pé pelo quarteirão e uma caminhada noturna até a <b>Times Square</b> só pra sentir o choque de luz e som."},
  {tag:"Midtown", title:"Times Square & Theater District", text:"Manhã tranquila, tarde livre pra explorar a <b>Times Square</b> com calma e à noite, primeiro <b>musical da Broadway</b> da viagem."},
  {tag:"Vista", title:"Empire State & 5th Avenue", text:"Fifth Avenue, Bryant Park, NY Public Library e pôr do sol lá em cima, no mirante do <b>Empire State Building</b>."},
  {tag:"Parque", title:"Central Park: dia inteiro", text:"Bethesda Terrace, Bow Bridge, Strawberry Fields e um passeio de bike pelo loop completo do <b>Central Park</b>."},
  {tag:"Cultura", title:"Museus & Upper Side", text:"MET ou MoMA pela manhã, Upper East ou Upper West Side à tarde, entre livrarias, cafés e ruas mais calmas."},
  {tag:"Travessia", title:"Ponte do Brooklyn a pé", text:"Manhattan → Brooklyn caminhando pela <b>Ponte do Brooklyn</b>, com parada em DUMBO pra foto na Washington St."},
  {tag:"Brooklyn", title:"Brooklyn Heights & Williamsburg", text:"Promenade de Brooklyn Heights de manhã, tarde e noite em Williamsburg, entre lojinhas, arte de rua e jantar por lá."},
  {tag:"Brooklyn", title:"Park Slope & Prospect Park", text:"Ritmo de bairro: Prospect Park, Park Slope e os restaurantes locais do <b>Brooklyn</b> na agenda do dia."},
  {tag:"Downtown", title:"9/11 Memorial & Estátua da Liberdade", text:"Memorial e museu do 9/11 de manhã, ferry até a Estátua da Liberdade e Ellis Island à tarde."},
  {tag:"Vila", title:"SoHo, Village & High Line", text:"Compras em SoHo, tarde no Greenwich Village, caminhada elevada na High Line e parada no Chelsea Market."},
  {tag:"Broadway", title:"Segundo musical & Lincoln Center", text:"Upper West Side e Lincoln Center de dia, segundo <b>musical da Broadway</b> da viagem à noite."},
  {tag:"Livre", title:"Compras & Rockefeller Center", text:"Dia mais livre: Fifth Ave, Herald Square e subida ao Top of the Rock pra ver o Empire State de fora."},
  {tag:"História", title:"Chinatown & Little Italy", text:"Ruas estreitas, mercados e comida de rua em Chinatown, seguido de café e cannoli em Little Italy."},
  {tag:"Brooklyn", title:"Brooklyn extra & jantar de despedida", text:"Bushwick pra arte de rua ou Coney Island se der tempo, fechando com um jantar especial de despedida."},
  {tag:"Partida", title:"Últimas compras & embarque", text:"Café da manhã com calma, últimas lembrancinhas e embarque de volta pra casa."}
];

/* ---------------- FINE DINING ---------------- */
const restaurants = [
  {name:"Marea", borough:"Manhattan", neighborhood:"Columbus Circle / Central Park South", address:"240 Central Park S, New York, NY 10019", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado, agregado de plataformas públicas", price:"$$$$", cuisine:"Italiano · Frutos do mar", blurb:"Vista para o Central Park e massas de frutos do mar que já foram templo de duas estrelas Michelin.", mapsQuery:"Marea, 240 Central Park S, New York, NY"},
  {name:"Le Bernardin", borough:"Manhattan", neighborhood:"Midtown", address:"155 W 51st St, New York, NY 10019", michelin:{stars:3,selected:true}, rating:4.6, ratingNote:"aproximado, agregado de plataformas públicas", price:"$$$$", cuisine:"Francês · Frutos do mar", blurb:"O templo do peixe em Nova York, comandado por Eric Ripert há décadas, com três estrelas Michelin.", mapsQuery:"Le Bernardin, 155 W 51st St, New York, NY"},
  {name:"The Modern", borough:"Manhattan", neighborhood:"Midtown (MoMA)", address:"9 W 53rd St, New York, NY 10019", michelin:{stars:2,selected:true}, rating:4.6, ratingNote:"aproximado, agregado de plataformas públicas", price:"$$$$", cuisine:"Americano moderno", blurb:"Alta gastronomia contemporânea de frente para o jardim de esculturas do MoMA.", mapsQuery:"The Modern restaurant, 9 W 53rd St, New York, NY"},
  {name:"Manhatta", borough:"Manhattan", neighborhood:"Financial District", address:"28 Liberty St, 60º andar, New York, NY 10005", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado, Google ~4.7 / Tripadvisor ~4.5", price:"$$$$", cuisine:"Americano moderno", blurb:"Jantar refinado no 60º andar com a skyline de Manhattan a seus pés.", mapsQuery:"Manhatta restaurant, 28 Liberty St, New York, NY"},
  {name:"Olio e Più", borough:"Manhattan", neighborhood:"West Village / Greenwich Village", address:"3 Greenwich Ave, New York, NY 10014", michelin:{stars:0,selected:false}, rating:4.5, ratingNote:"aproximado, faixa 4.4–4.7 entre plataformas", price:"$$$", cuisine:"Italiano", blurb:"Trattoria descontraída no West Village, sempre lotada, com massas frescas e pizza no forno a lenha.", mapsQuery:"Olio e Più, 3 Greenwich Ave, New York, NY"},
  {name:"Osteria Nonnino", borough:"Manhattan", neighborhood:"West Village / Meatpacking District", address:"637 Hudson St, New York, NY 10014", michelin:{stars:0,selected:false}, rating:4.7, ratingNote:"aproximado, Google citado em 4.8", price:"$$$", cuisine:"Italiano", blurb:"Cantina ítalo-siciliana de família, entre o West Village e o Meatpacking, com cacio e pepe feito à mesa.", mapsQuery:"Osteria Nonnino, 637 Hudson St, New York, NY"},
  {name:"Ci Siamo", borough:"Manhattan", neighborhood:"Hudson Yards / Manhattan West", address:"440 W 33rd St, New York, NY 10001", michelin:{stars:0,selected:true}, rating:4.5, ratingNote:"aproximado, faixa 4.4–4.6", price:"$$$", cuisine:"Italiano · fogo vivo", blurb:"Cozinha italiana no fogo vivo em Hudson Yards, eleita restaurante nº1 dos EUA pelo Yelp em 2026.", mapsQuery:"Ci Siamo, 440 W 33rd St, New York, NY"},
  {name:"Osteria La Baia", borough:"Manhattan", neighborhood:"Midtown", address:"129 W 52nd St, New York, NY 10019", michelin:{stars:0,selected:false}, rating:4.4, ratingNote:"aproximado, confirmado no Tripadvisor", price:"$$$", cuisine:"Italiano", blurb:"Trattoria elegante em Midtown com octopus carpaccio e branzino grelhado.", mapsQuery:"Osteria La Baia, 129 W 52nd St, New York, NY"},
  {name:"Sicily Osteria", borough:"Manhattan", neighborhood:"Hell's Kitchen / Theater District", address:"330 W 46th St, New York, NY 10036", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado, Google citado em 4.6", price:"$$$", cuisine:"Italiano · Siciliano", blurb:"Sabores da Sicília na Restaurant Row, parada certeira antes da Broadway.", mapsQuery:"Sicily Osteria, 330 W 46th St, New York, NY"},
  {name:"Per Se", borough:"Manhattan", neighborhood:"Columbus Circle / Midtown", address:"10 Columbus Circle, 4º andar, New York, NY 10019", michelin:{stars:3,selected:true}, rating:4.6, ratingNote:"aproximado, faixa 4.5–4.8", price:"$$$$", cuisine:"Francês · Americano", blurb:"A experiência definitiva de Thomas Keller, com vista pro Columbus Circle e três estrelas Michelin.", mapsQuery:"Per Se restaurant, 10 Columbus Circle, New York, NY"},

  {name:"Piccola Cucina Casa", borough:"Brooklyn", neighborhood:"Boerum Hill", address:"141 Nevins St, Brooklyn, NY 11201", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado, Yelp/Tripadvisor", price:"$$$", cuisine:"Italiano", blurb:"Passeio pelas regiões da Itália num cantinho aconchegante do Boerum Hill, do polvo pugliese à milanesa lombarda.", mapsQuery:"Piccola Cucina Casa, 141 Nevins St, Brooklyn, NY"},
  {name:"Osteria Brooklyn", borough:"Brooklyn", neighborhood:"Clinton Hill", address:"458 Myrtle Ave, Brooklyn, NY 11205", michelin:{stars:0,selected:false}, rating:4.5, ratingNote:"aproximado", price:"$$$", cuisine:"Italiano", blurb:"Clássico romântico da Myrtle Avenue, conhecido pela fettuccine servida dentro da roda de parmesão.", mapsQuery:"Osteria Brooklyn, 458 Myrtle Ave, Brooklyn, NY"},
  {name:"Montesacro", borough:"Brooklyn", neighborhood:"Williamsburg", address:"432 Union Ave, Brooklyn, NY 11211", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado", price:"$$", cuisine:"Italiano", blurb:"Pinseria romana com jardim interno e teto retrátil, cacio e pepe e pinsa em clima descontraído.", mapsQuery:"Montesacro, 432 Union Ave, Brooklyn, NY"},
  {name:"Concrete Sicilian Eatery", borough:"Brooklyn", neighborhood:"Bed-Stuy / Bushwick", address:"906 Broadway, Brooklyn, NY 11206", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado", price:"$$", cuisine:"Italiano · Siciliano", blurb:"Cozinha siciliana sem pretensão na divisa de Bed-Stuy com Bushwick, com ingredientes importados da Itália.", mapsQuery:"Concrete Sicilian Eatery, 906 Broadway, Brooklyn, NY"},
  {name:"al Badawi", borough:"Brooklyn", neighborhood:"Brooklyn Heights (Atlantic Ave)", address:"151 Atlantic Ave, Brooklyn, NY 11201", michelin:{stars:0,selected:true}, rating:4.5, ratingNote:"aproximado", price:"$$", cuisine:"Oriente Médio", blurb:"Charme palestino na Atlantic Avenue, fachada florida e maklouba generosa. Selecionado pelo Michelin Guide.", mapsQuery:"al Badawi, 151 Atlantic Ave, Brooklyn, NY"},
  {name:"Boutros", borough:"Brooklyn", neighborhood:"Brooklyn Heights / Cobble Hill", address:"185 Atlantic Ave, Brooklyn, NY 11201", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado", price:"$$$", cuisine:"Oriente Médio", blurb:"Cozinha levantina contemporânea de chef libanês-sírio, com coquetéis autorais e pita fresca.", mapsQuery:"Boutros restaurant, 185 Atlantic Ave, Brooklyn, NY"},
  {name:"Black Iris", borough:"Brooklyn", neighborhood:"Fort Greene / Clinton Hill", address:"228 DeKalb Ave, Brooklyn, NY 11205", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado", price:"$$", cuisine:"Mediterrâneo", blurb:"Queridinho de bairro para mezze, kebabs e brunch farto entre Fort Greene e Clinton Hill.", mapsQuery:"Black Iris restaurant, 228 DeKalb Ave, Brooklyn, NY"},
  {name:"Chama Mama", borough:"Brooklyn", neighborhood:"Brooklyn Heights", address:"121 Montague St, Brooklyn, NY 11201", michelin:{stars:0,selected:false}, rating:4.3, ratingNote:"aproximado, avaliações mistas entre plataformas", price:"$$", cuisine:"Georgiano", blurb:"Khachapuri quentinho, khinkali e vinho saperavi num salão claro na Montague Street.", mapsQuery:"Chama Mama, 121 Montague St, Brooklyn, NY"},
  {name:"Macosa Trattoria", borough:"Brooklyn", neighborhood:"Bedford-Stuyvesant", address:"310 Tompkins Ave, Brooklyn, NY 11216", michelin:{stars:0,selected:false}, rating:4.6, ratingNote:"aproximado", price:"$$$", cuisine:"Italiano", blurb:"Trattoria de bairro com fachada rústica, quintal iluminado e ragu de rabada de wagyu cozido por 12 horas.", mapsQuery:"Macosa Trattoria, 310 Tompkins Ave, Brooklyn, NY"},
  {name:"Henry's End", borough:"Brooklyn", neighborhood:"Brooklyn Heights", address:"72 Henry St, Brooklyn, NY 11201", michelin:{stars:0,selected:false}, rating:4.5, ratingNote:"aproximado", price:"$$$", cuisine:"Americano clássico", blurb:"Instituição de Brooklyn Heights há mais de 40 anos, famosa pelos pratos de caça e carta de vinhos premiada.", mapsQuery:"Henry's End, 72 Henry St, Brooklyn, NY"}
];

/* ---------------- BURGERS ---------------- */
const burgers = [
  {name:"Au Cheval", borough:"Manhattan", neighborhood:"Tribeca", address:"33 Cortlandt Alley, New York, NY 10013", rating:4.6, ratingNote:"aproximado, faixa 4.6–4.7", price:"$$", cuisine:"Hamburgueria gourmet", blurb:"O lendário smash burger de Chicago, agora numa esquina escondida do Tribeca.", mapsQuery:"Au Cheval, 33 Cortlandt Alley, New York, NY"},
  {name:"7th Street Burger", borough:"Manhattan", neighborhood:"East Village", address:"91 E 7th St, New York, NY 10009", rating:4.5, ratingNote:"aproximado", price:"$", cuisine:"Smash burger", blurb:"Fenômeno viral do East Village que virou rede pelo smash burger simples e rápido.", mapsQuery:"7th Street Burger, 91 E 7th St, New York, NY"},
  {name:"Black Iron Burger", borough:"Manhattan", neighborhood:"Garment District", address:"245 W 38th St, New York, NY 10018", rating:4.4, ratingNote:"aproximado, Tripadvisor ~4.5", price:"$$", cuisine:"Clássico americano", blurb:"Hambúrguer robusto e sem frescura no Garment District.", mapsQuery:"Black Iron Burger, 245 W 38th St, New York, NY"},
  {name:"5 Napkin Burger", borough:"Manhattan", neighborhood:"Hell's Kitchen", address:"630 9th Ave, New York, NY 10036", rating:null, ratingNote:"avaliações mistas, sem consolidado confiável", price:"$$", cuisine:"Hamburgueria gourmet", blurb:"O clássico gourmet que ajudou a popularizar o hambúrguer chique perto da Broadway.", mapsQuery:"5 Napkin Burger, 630 9th Ave, New York, NY"},
  {name:"Fat Ronnie's Burger Bar", borough:"Manhattan", neighborhood:"West Village", address:"303 6th Ave, New York, NY 10014", rating:null, ratingNote:"unidade muito recente, poucas avaliações ainda", price:"$$", cuisine:"Clássico americano", blurb:"Instituição de Martha's Vineyard estreando em Nova York, no West Village.", mapsQuery:"Fat Ronnie's Burger Bar, 303 6th Ave, New York, NY"},
  {name:"Lovely's Old Fashioned", borough:"Manhattan", neighborhood:"Hell's Kitchen", address:"642 9th Ave, New York, NY 10036", rating:4.7, ratingNote:"aproximado", price:"$", cuisine:"Clássico americano", blurb:"Hambúrguer despretensioso e querido da vizinhança, escondido na Hell's Kitchen.", mapsQuery:"Lovely's Old Fashioned, 642 9th Ave, New York, NY"},
  {name:"Bareburger", borough:"Manhattan", neighborhood:"várias unidades (West Village, Hell's Kitchen, UWS)", address:null, rating:4.1, ratingNote:"aproximado, varia por unidade (3.8–4.4)", price:"$$", cuisine:"Hamburgueria orgânica", blurb:"Rede local pioneira em hambúrgueres orgânicos e sustentáveis, com várias unidades em Manhattan.", mapsQuery:"Bareburger Manhattan, New York, NY"},

  {name:"Brooklyn Burgers & Beer", borough:"Brooklyn", neighborhood:"Park Slope", address:"259 5th Ave, Brooklyn, NY 11215", rating:4.5, ratingNote:"aproximado", price:"$$", cuisine:"Bar burger", blurb:"Bar de bairro na 5th Avenue com burgers de carne orgânica e opção de montar o seu próprio.", mapsQuery:"Brooklyn Burgers & Beer, 259 5th Ave, Brooklyn, NY"},
  {name:"All Star Burgers", borough:"Brooklyn", neighborhood:"Clinton Hill", address:"154 Clinton Ave, Brooklyn, NY 11205", rating:4.5, ratingNote:"aproximado, amostra pequena", price:"$", cuisine:"Clássico americano", blurb:"Cantinho de esquina em Clinton Hill, favorito rápido do bairro para burger e sanduíche.", mapsQuery:"All Star Burgers, 154 Clinton Ave, Brooklyn, NY"},
  {name:"7th Street Burger (Downtown Brooklyn)", borough:"Brooklyn", neighborhood:"Downtown Brooklyn", address:"400 Jay St, Brooklyn, NY 11201", rating:4.2, ratingNote:"aproximado, varia por plataforma (4.0–4.5)", price:"$", cuisine:"Smash burger", blurb:"Filial do queridinho nascido no East Village, famoso pelo duplo cheeseburger simples e batatas crocantes.", mapsQuery:"7th Street Burger, 400 Jay St, Brooklyn, NY"},
  {name:"Stack'd Burger", borough:"Brooklyn", neighborhood:"Downtown Brooklyn", address:"18 Nevins St, Brooklyn, NY 11217", rating:4.8, ratingNote:"aproximado", price:"$", cuisine:"Hamburgueria halal", blurb:"Hamburgueria e wing spot halal, carne e frango sem hormônio, com nota altíssima entre os moradores.", mapsQuery:"Stack'd Burger, 18 Nevins St, Brooklyn, NY"},
  {name:"Fulton Burger", borough:"Brooklyn", neighborhood:"Park Slope", address:"177 5th Ave, Brooklyn, NY 11215", rating:null, ratingNote:"nota não encontrada de forma confiável", price:"$$", cuisine:"Clássico americano", blurb:"Balcão simples e sem frescura nas franjas do Park Slope, burger-fritas-milkshake sem complicação.", mapsQuery:"Fulton Burger, 177 5th Ave, Brooklyn, NY"},
  {name:"XO Burgers", borough:"Brooklyn", neighborhood:"Park Slope", address:"437 5th Ave, Brooklyn, NY 11215", rating:4.7, ratingNote:"aproximado", price:"$$", cuisine:"Clássico americano", blurb:"Burgers enormes com molho XO autoral, disputando a 5th Avenue com Shake Shack e Five Guys.", mapsQuery:"XO Burgers, 437 5th Ave, Brooklyn, NY"},
  {name:"two8two Bar & Burger", borough:"Brooklyn", neighborhood:"Boerum Hill / Cobble Hill", address:"282 Atlantic Ave, Brooklyn, NY 11201", rating:4.4, ratingNote:"aproximado", price:"$$", cuisine:"Bar burger", blurb:"Bar-burger clássico da Atlantic Avenue desde 2011, decoração descontraída e cardápio de sempre-favoritos.", mapsQuery:"two8two Bar & Burger, 282 Atlantic Ave, Brooklyn, NY"},
  {name:"Bareburger (Brooklyn)", borough:"Brooklyn", neighborhood:"Cobble Hill", address:"149 Court St, Brooklyn, NY 11201", rating:3.4, ratingNote:"aproximado, Yelp", price:"$$", cuisine:"Hamburgueria orgânica", blurb:"Rede de burgers orgânicos e sustentáveis com carne grass-fed. Unidade de Cobble Hill, já que a de Park Slope fechou.", mapsQuery:"Bareburger, 149 Court St, Brooklyn, NY"}
];

/* ============================================================
   RENDER HELPERS
   ============================================================ */
const ACCENTS = ['#f7b500','#e0392b','#c9a24b','#00933c','#2850ad'];
function accentFor(str){
  let h=0; for(let i=0;i<str.length;i++) h=(h*31+str.charCodeAt(i))>>>0;
  return ACCENTS[h % ACCENTS.length];
}

function starsHTML(rating){
  if(rating==null){
    return `<span style="font-family:'Special Elite',monospace;font-size:.72rem;color:var(--cream-dim)">avaliação em verificação</span>`;
  }
  let out = `<span class="stars">`;
  for(let i=1;i<=5;i++){
    const on = i<=Math.round(rating);
    out += `<svg class="${on?'on':''}"><use href="#i-star"/></svg>`;
  }
  out += `</span><span class="rating-num">${rating.toFixed(1)}</span>`;
  return out;
}

function michelinHTML(m){
  if(!m) return '';
  if(m.stars>0){
    return `<div class="michelin" title="Estrela(s) Michelin">${'★'.repeat(m.stars)} MICHELIN</div>`;
  }
  if(m.selected){
    return `<div class="michelin" style="border-color:var(--brass);color:var(--brass)" title="Listado no Michelin Guide, sem estrela">GUIA MICHELIN</div>`;
  }
  return '';
}

function mediaIllustration(icon, tint){
  return `<div class="illustration" style="background:radial-gradient(circle at 50% 40%, ${tint}22, transparent 70%)">
    <svg viewBox="0 0 24 24" style="fill:${tint}"><use href="#${icon}"/></svg>
  </div>`;
}

function mapBlock(query, slug){
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  return `
  <div class="map-wrap" data-slug="${slug}">
    <div class="map-lock" data-lock>
      <svg><use href="#i-lock"/></svg>
      <span>Toque para destravar o mapa</span>
    </div>
    <iframe src="${src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" style="pointer-events:none" title="Mapa: ${query}"></iframe>
  </div>
  <div class="map-actions">
    <a href="https://www.google.com/maps/search/${encodeURIComponent(query)}" target="_blank" rel="noopener">
      Abrir no Google Maps <svg><use href="#i-ext"/></svg>
    </a>
  </div>`;
}

function landmarkCard(item, i){
  const slug = slugify(item.name);
  const tint = accentFor(item.name);
  return `
  <article class="card landmark-card reveal-scale" style="transition-delay:${(i%3)*0.08}s">
    <div class="card-media">
      <span class="cat-tag">Ponto ${i+1} de 6</span>
      <img src="assets/fotos/${slug}.jpg" alt="${item.name}" loading="lazy" onerror="this.style.display='none'">
      ${mediaIllustration(item.icon, tint)}
    </div>
    <div class="card-body">
      <h3>${item.name}</h3>
      <div class="card-loc"><svg><use href="#i-pin"/></svg>${item.neighborhood}</div>
      <p class="card-blurb">${item.blurb}</p>
      <p class="card-blurb" style="color:var(--taxi-2)"><b>Dica:</b> ${item.tip}</p>
      <button class="map-toggle" data-map-toggle="${slug}"><svg><use href="#i-map"/></svg>Ver no mapa</button>
    </div>
    ${mapBlock(item.mapsQuery, slug)}
  </article>`;
}

function placeCard(item, type){
  const slug = slugify(item.name);
  const tint = accentFor(item.cuisine||item.name);
  const icon = type==='burger' ? 'i-burger' : 'i-fork';
  return `
  <article class="card reveal-scale" data-borough="${item.borough}">
    <div class="card-media">
      <span class="cat-tag">${item.cuisine}</span>
      ${type==='fine' ? michelinHTML(item.michelin) : ''}
      <img src="assets/fotos/${slug}.jpg" alt="${item.name}" loading="lazy" onerror="this.style.display='none'">
      ${mediaIllustration(icon, tint)}
    </div>
    <div class="card-body">
      <h3>${item.name}</h3>
      <div class="card-loc"><svg><use href="#i-pin"/></svg>${item.neighborhood} · ${item.borough}</div>
      <p class="card-blurb">${item.blurb}</p>
      <div class="card-row">
        ${starsHTML(item.rating)}
        <span class="price">${item.price}</span>
      </div>
      <button class="map-toggle" data-map-toggle="${slug}"><svg><use href="#i-map"/></svg>Ver localização</button>
    </div>
    ${mapBlock(item.mapsQuery, slug)}
  </article>`;
}

function dayStop(day, i){
  return `
  <div class="day-stop reveal" data-index="${i}">
    <div class="day-dot">${i+1}</div>
    <div class="day-card">
      <div class="day-head">
        <h3>Dia ${i+1}</h3>
        <span class="day-tag">${day.tag}</span>
      </div>
      <p><span class="day-highlight">${day.title}.</span> ${day.text}</p>
    </div>
  </div>`;
}

/* ============================================================
   PAINT
   ============================================================ */
document.getElementById('landmarksGrid').innerHTML = landmarks.map(landmarkCard).join('');
document.getElementById('restaurantsGrid').innerHTML = restaurants.map(r=>placeCard(r,'fine')).join('');
document.getElementById('burgersGrid').innerHTML = burgers.map(b=>placeCard(b,'burger')).join('');
document.getElementById('dayStops').innerHTML = itinerary.map(dayStop).join('');

/* ticker content, duplicated for seamless loop */
const tickerItems = [
  "15 DIAS EM NOVA YORK","PONTE DO BROOKLYN AO AMANHECER","TIMES SQUARE DE NOITE",
  "MUSICAL NA BROADWAY","TOPO DO EMPIRE STATE","CENTRAL PARK DE BIKE","BROOKLYN INTEIRO PRA EXPLORAR"
];
document.getElementById('ticker').innerHTML = (tickerItems.concat(tickerItems)).map(t=>`<span>${t}</span>`).join('');

/* loader letters */
const loaderText = "NEW YORK";
document.getElementById('loaderSign').innerHTML = loaderText.split('').map((c,i)=>
  `<span style="animation-delay:${i*0.08}s">${c===' '?'&nbsp;':c}</span>`).join('');

/* ============================================================
   SKYLINE (parallax layers)
   ============================================================ */
function buildSkyline(seed, count, minH, maxH, color, width=1400, height=260){
  let x=0, rects='', rng=seed;
  const rand=()=>{ rng=(rng*9301+49297)%233280; return rng/233280; };
  while(x<width){
    const w = 28+rand()*46;
    const h = minH+rand()*(maxH-minH);
    const y = height-h;
    rects += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${color}"/>`;
    if(rand()>0.55){
      const rows=Math.floor(h/16);
      for(let r=1;r<rows;r++){
        for(let cx=x+6;cx<x+w-6;cx+=10){
          if(rand()>0.45) rects += `<rect x="${cx.toFixed(1)}" y="${(y+r*16).toFixed(1)}" width="4" height="6" fill="#0a0d16" opacity="${0.5+rand()*0.5}"/>`;
        }
      }
    }
    x += w+ (rand()*6);
  }
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}
document.getElementById('skyFar').innerHTML  = buildSkyline(11, 40, 60, 140, '#232a3f');
document.getElementById('skyMid').innerHTML  = buildSkyline(27, 40, 90, 200, '#171d2c');
document.getElementById('skyNear').innerHTML = buildSkyline(53, 40, 60, 230, '#0d1119');

/* ============================================================
   INTERACTIONS
   ============================================================ */

/* loader out */
window.addEventListener('load', ()=>{
  setTimeout(()=>document.getElementById('loader').classList.add('hide'), 1500);
});

/* nav on scroll */
const nav = document.getElementById('siteNav');
const totop = document.getElementById('totop');
function onScroll(){
  const y = window.scrollY;
  nav.classList.toggle('scrolled', y>40);
  totop.classList.toggle('show', y>800);

  /* hero parallax */
  const far=document.getElementById('skyFar'), mid=document.getElementById('skyMid'), near=document.getElementById('skyNear');
  if(y < window.innerHeight*1.2){
    far.style.transform  = `translateY(${y*0.08}px)`;
    mid.style.transform  = `translateY(${y*0.16}px)`;
    near.style.transform = `translateY(${y*0.26}px)`;
  }

  /* subway progress line */
  const line = document.getElementById('subwayLine');
  if(line){
    const rect = line.getBoundingClientRect();
    const total = rect.height;
    const viewed = Math.min(Math.max(window.innerHeight*0.6 - rect.top, 0), total);
    document.getElementById('trackProgress').style.height = (viewed/total*100)+'%';
  }
}
document.addEventListener('scroll', onScroll, {passive:true});
onScroll();

totop.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));

/* reveal on scroll */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
},{threshold:0.15});
document.querySelectorAll('.reveal, .reveal-scale, .day-stop').forEach(el=>io.observe(el));

/* map toggle + lock */
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('[data-map-toggle]');
  if(btn){
    const wrap = btn.closest('.card, .landmark-card').querySelector('.map-wrap');
    wrap.classList.toggle('open');
    btn.textContent = wrap.classList.contains('open') ? 'Fechar mapa' : (btn.dataset.label || 'Ver no mapa');
    if(wrap.classList.contains('open') && !btn.dataset.label){
      btn.dataset.label = btn.querySelector('svg') ? btn.textContent : btn.textContent;
    }
    return;
  }
  const lock = e.target.closest('[data-lock]');
  if(lock){
    lock.classList.add('hidden');
    const iframe = lock.parentElement.querySelector('iframe');
    iframe.style.pointerEvents = 'auto';
    return;
  }
});

/* tabs filter */
document.querySelectorAll('.tabs').forEach(tabGroup=>{
  const targetId = tabGroup.dataset.target;
  const grid = document.getElementById(targetId);
  tabGroup.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabGroup.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      grid.querySelectorAll('[data-borough]').forEach(card=>{
        const show = filter==='all' || card.dataset.borough===filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });
});
