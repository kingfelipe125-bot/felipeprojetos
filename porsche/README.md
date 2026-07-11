# PORSCHE — Um Filme Interativo (site tributo não-oficial)

Experiência cinematográfica 3D construída inteiramente em código com
[Three.js](https://threejs.org) (MIT). O scroll não rola uma página: ele
avança um "filme" que atravessa cinco salas, cada uma com sua própria
cena, iluminação e animação.

## As salas

1. **O Salão** — 911 estilizado em plataforma giratória sob um canhão de luz.
2. **História** — galeria com painéis de 1931 a hoje e o "esboço" de um 911 em wireframe dourado.
3. **O Coração Boxer** — o carro **desacopla**: a carroceria sobe, as rodas se afastam, o motor
   boxer de 6 cilindros desliza para fora e se abre peça por peça (ventoinha, cilindros aletados,
   virabrequim com pistões animados, admissão e escapamento). Reversível pelo scroll ou pelo botão.
4. **Lendas** — 356, 911, 917 e 918 Spyder em pedestais giratórios.
5. **A Estrada** — plano noturno final com o carro em movimento.

## Controles

- **Scroll / setas / espaço** — avança e retrocede o filme
- **Arrastar (mouse ou toque horizontal)** — olha ao redor em qualquer cena
- **Toque vertical** — avança o filme no celular
- **Menu lateral** — salta direto para cada capítulo

## Como rodar

O site usa módulos ES, então precisa de um servidor HTTP (não funciona via `file://`):

```bash
cd porsche
python3 -m http.server 8000
# abra http://localhost:8000
```

Funciona também direto no GitHub Pages (pasta `porsche/`).

## Direitos autorais

Nenhuma foto, vídeo, logotipo ou modelo 3D oficial da Porsche é utilizado.
Todos os modelos 3D (carros, motor, cenários) são originais, desenhados em
código neste repositório. O nome "Porsche" aparece apenas em textos
informativos/editoriais. Site tributo não-oficial, sem afiliação com a
Porsche AG. Three.js é distribuído sob licença MIT (cópia em
`vendor/three/LICENSE`).
