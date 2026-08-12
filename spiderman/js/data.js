const FILMES = [
  {
    id: "de-volta-ao-lar",
    titulo: "Homem-Aranha: De Volta ao Lar",
    ano: 2017,
    poster: "assets/capas/de-volta-ao-lar.jpg",
    nota: "Primeira aparição de Peter Parker como protagonista no Universo Cinematográfico Marvel, sob a orientação de Tony Stark.",
    resumo: "Depois de ajudar os Vingadores em Berlim, Peter Parker volta à rotina de estudante no Queens, ansioso para provar que está pronto para mais responsabilidades. Ele acaba investigando por conta própria um esquema de armas alienígenas comandado pelo Abutre, o que o coloca em rota de colisão com Tony Stark.",
    trajes: [
      {
        nome: "Traje Homecoming",
        imagem: "assets/trajes/traje-homecoming.png",
        nota: "Primeiro traje avançado entregue por Tony Stark a Peter Parker, equipado com recursos tecnológicos da Stark Industries.",
      },
    ],
    viloes: [
      {
        nome: "Abutre",
        identidade: "Adrian Toomes",
        ator: "Michael Keaton",
        imagem: "assets/viloes/abutre.png",
        nota: "Ex-contratante de limpeza de destroços alienígenas que se voltou ao contrabando de tecnologia após perder o próprio negócio.",
      },
    ],
  },
  {
    id: "guerra-infinita",
    titulo: "Vingadores: Guerra Infinita",
    ano: 2018,
    poster: "assets/capas/guerra-infinita.jpg",
    nota: "Peter Parker se junta aos Vingadores no confronto contra Thanos, recebendo um novo equipamento de combate.",
    resumo: "Thanos parte em busca das seis Joias do Infinito para eliminar metade da vida no universo. Peter Parker é levado por Tony Stark para a batalha em Titã, unindo forças com os Guardiões da Galáxia contra o titã louco.",
    trajes: [
      {
        nome: "Traje Aranha de Ferro",
        imagem: "assets/trajes/traje-aranha-de-ferro.png",
        nota: "Equipamento com pernas mecânicas retráteis, projetado por Tony Stark. Também utilizado em Vingadores: Ultimato (2019).",
      },
    ],
    viloes: [
      {
        nome: "Thanos",
        identidade: "Thanos",
        ator: "Josh Brolin",
        imagem: "assets/viloes/thanos.png",
        nota: "O Titã Louco parte em busca das seis Joias do Infinito para eliminar metade de toda a vida no universo com um estalar de dedos.",
      },
    ],
  },
  {
    id: "ultimato",
    titulo: "Vingadores: Ultimato",
    ano: 2019,
    poster: "assets/capas/ultimato.webp",
    nota: "Desfecho da saga do Infinito, com o retorno de Peter Parker à batalha final contra Thanos, ainda com o Traje Aranha de Ferro apresentado em Guerra Infinita.",
    resumo: "Cinco anos após o estalar de dedos de Thanos, os Vingadores sobreviventes traçam um plano para reverter a devastação. Peter Parker retorna à ativa para a batalha final que decide o destino do universo.",
    trajes: [
      {
        nome: "Traje Aranha de Ferro",
        imagem: "assets/trajes/traje-aranha-de-ferro.png",
        nota: "Mesmo equipamento apresentado em Vingadores: Guerra Infinita (2018), usado novamente na batalha final contra Thanos.",
      },
    ],
    viloes: [
      {
        nome: "Thanos",
        identidade: "Thanos",
        ator: "Josh Brolin",
        imagem: "assets/viloes/thanos.png",
        nota: "Já instalado em sua fazenda após o estalar de dedos, é confrontado por uma versão passada de si mesmo trazida ao presente pelos Vingadores.",
      },
    ],
  },
  {
    id: "longe-de-casa",
    titulo: "Homem-Aranha: Longe de Casa",
    ano: 2019,
    poster: "assets/capas/longe-de-casa.jpg",
    nota: "Peter Parker enfrenta Mysterio durante uma viagem escolar pela Europa, tentando equilibrar a vida de herói e estudante.",
    resumo: "Peter Parker viaja para a Europa com os colegas de escola, torcendo por um tempo longe da vida de herói. Nick Fury tem outros planos e o recruta para enfrentar seres elementais ao lado de um misterioso aliado, Quentin Beck.",
    trajes: [
      {
        nome: "Traje Furtivo",
        imagem: "assets/trajes/traje-furtivo.png",
        nota: "Uniforme discreto de operações táticas, cedido por Nick Fury durante a viagem escolar pela Europa.",
      },
      {
        nome: "Traje Aprimorado",
        imagem: "assets/trajes/traje-aprimorado.png",
        nota: "Versão em vermelho e preto apresentada por Peter Parker como o primeiro uniforme de sua própria concepção.",
      },
      {
        nome: "Traje Integrado",
        imagem: "assets/trajes/traje-integrado.png",
        nota: "Versão final do traje, utilizada no confronto decisivo contra Mysterio nas ruas de Londres.",
      },
    ],
    viloes: [
      {
        nome: "Mysterio",
        identidade: "Quentin Beck",
        ator: "Jake Gyllenhaal",
        imagem: "assets/viloes/mysterio.png",
        nota: "Ex-funcionário da Stark Industries que forjou uma identidade heroica utilizando ilusões e uma frota de drones.",
      },
    ],
  },
  {
    id: "sem-volta-pra-casa",
    titulo: "Homem-Aranha: Sem Volta Pra Casa",
    ano: 2021,
    poster: "assets/capas/sem-volta-pra-casa.jpg",
    nota: "Um feitiço malsucedido rompe o multiverso, trazendo vilões de outras realidades para enfrentar Peter Parker.",
    resumo: "Com sua identidade secreta revelada, Peter Parker pede ajuda a Doutor Estranho para que o mundo esqueça que ele é o Homem-Aranha. O feitiço dá errado e abre portas para vilões de outras realidades que conhecem o Homem-Aranha, mas não o Peter Parker deste universo.",
    trajes: [
      {
        nome: "Traje Integrado",
        imagem: "assets/trajes/traje-integrado-nwh.png",
        nota: "Mesmo traje apresentado em Homem-Aranha: Longe de Casa (2019), usado por Peter Parker no início do filme, antes do feitiço de Doutor Estranho.",
      },
    ],
    viloes: [
      {
        nome: "Doutor Octopus",
        identidade: "Otto Octavius",
        ator: "Alfred Molina",
        imagem: "assets/viloes/dr-octopus.png",
        nota: "Cientista cujos braços mecânicos assumiram controle sobre sua mente, trazido de outra realidade por uma fenda multiversal.",
      },
      {
        nome: "Lagarto",
        identidade: "Dr. Curt Connors",
        ator: "Rhys Ifans",
        imagem: "assets/viloes/lagarto.png",
        nota: "Pesquisador transformado após um experimento próprio com regeneração celular, também originário de outra realidade.",
      },
      {
        nome: "Homem-Areia",
        identidade: "Flint Marko",
        ator: "Thomas Haden Church",
        imagem: "assets/viloes/homem-areia.png",
        nota: "Fugitivo com o corpo transformado em areia manipulável após um acidente com um acelerador de partículas.",
      },
    ],
  },
];
