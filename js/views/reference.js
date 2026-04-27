/**
 * js/views/reference.js — View: Referência Rápida de Química
 * Lavoisier — Laboratório Visual de Química
 *
 * Conteúdo dividido por nível de ensino:
 *   EF1 (1–5º ano), EF2 (6–9º ano), EM (Ensino Médio), ES (Ensino Superior)
 * Inclui tabela periódica completa (118 elementos) com legenda de categorias.
 *
 * Layout: sidebar sticky + conteúdo principal
 * Exporta: renderReference(outlet)
 */

import { esc } from '../ui.js';

// ─── Dados da tabela periódica ────────────────────────────────────────────────
// Categorias: alkali, alkaline, transition, post-transition, metalloid,
//             nonmetal, halogen, noble, lanthanide, actinide, unknown
const CATEGORIES = {
  alkali:         { label: 'Metais alcalinos',          color: '#e05a5a' },
  alkaline:       { label: 'Metais alcalinoterrosos',   color: '#e09450' },
  transition:     { label: 'Metais de transição',       color: '#6b7fd4' },
  'post-trans':   { label: 'Metais pós-transição',      color: '#9e9e9e' },
  metalloid:      { label: 'Semimetais',                color: '#4caf7d' },
  nonmetal:       { label: 'Não metais poliatômicos',   color: '#8b6abf' },
  halogen:        { label: 'Halogênios',                color: '#c0874f' },
  noble:          { label: 'Gases nobres',              color: '#3a8a6e' },
  lanthanide:     { label: 'Lantanídeos',               color: '#c0578a' },
  actinide:       { label: 'Actinídeos',                color: '#9356b8' },
  unknown:        { label: 'Prop. desconhecidas',       color: '#37474f' },
};

// [Z, símbolo, nome, massa_atômica, categoria, grupo, período]
// grupo 0 = lantanídeos/actinídeos (fora do grid principal)
const ELEMENTS = [
  [1,  'H',  'Hidrogênio',   '1,008',   'nonmetal',    1,  1],
  [2,  'He', 'Hélio',        '4,003',   'noble',       18, 1],
  [3,  'Li', 'Lítio',        '6,941',   'alkali',      1,  2],
  [4,  'Be', 'Berílio',      '9,012',   'alkaline',    2,  2],
  [5,  'B',  'Boro',         '10,81',   'metalloid',   13, 2],
  [6,  'C',  'Carbono',      '12,01',   'nonmetal',    14, 2],
  [7,  'N',  'Nitrogênio',   '14,01',   'nonmetal',    15, 2],
  [8,  'O',  'Oxigênio',     '16,00',   'nonmetal',    16, 2],
  [9,  'F',  'Flúor',        '19,00',   'halogen',     17, 2],
  [10, 'Ne', 'Neônio',       '20,18',   'noble',       18, 2],
  [11, 'Na', 'Sódio',        '22,99',   'alkali',      1,  3],
  [12, 'Mg', 'Magnésio',     '24,31',   'alkaline',    2,  3],
  [13, 'Al', 'Alumínio',     '26,98',   'post-trans',  13, 3],
  [14, 'Si', 'Silício',      '28,09',   'metalloid',   14, 3],
  [15, 'P',  'Fósforo',      '30,97',   'nonmetal',    15, 3],
  [16, 'S',  'Enxofre',      '32,06',   'nonmetal',    16, 3],
  [17, 'Cl', 'Cloro',        '35,45',   'halogen',     17, 3],
  [18, 'Ar', 'Argônio',      '39,95',   'noble',       18, 3],
  [19, 'K',  'Potássio',     '39,10',   'alkali',      1,  4],
  [20, 'Ca', 'Cálcio',       '40,08',   'alkaline',    2,  4],
  [21, 'Sc', 'Escândio',     '44,96',   'transition',  3,  4],
  [22, 'Ti', 'Titânio',      '47,87',   'transition',  4,  4],
  [23, 'V',  'Vanádio',      '50,94',   'transition',  5,  4],
  [24, 'Cr', 'Cromo',        '52,00',   'transition',  6,  4],
  [25, 'Mn', 'Manganês',     '54,94',   'transition',  7,  4],
  [26, 'Fe', 'Ferro',        '55,85',   'transition',  8,  4],
  [27, 'Co', 'Cobalto',      '58,93',   'transition',  9,  4],
  [28, 'Ni', 'Níquel',       '58,69',   'transition',  10, 4],
  [29, 'Cu', 'Cobre',        '63,55',   'transition',  11, 4],
  [30, 'Zn', 'Zinco',        '65,38',   'transition',  12, 4],
  [31, 'Ga', 'Gálio',        '69,72',   'post-trans',  13, 4],
  [32, 'Ge', 'Germânio',     '72,63',   'metalloid',   14, 4],
  [33, 'As', 'Arsênio',      '74,92',   'metalloid',   15, 4],
  [34, 'Se', 'Selênio',      '78,97',   'nonmetal',    16, 4],
  [35, 'Br', 'Bromo',        '79,90',   'halogen',     17, 4],
  [36, 'Kr', 'Criptônio',    '83,80',   'noble',       18, 4],
  [37, 'Rb', 'Rubídio',      '85,47',   'alkali',      1,  5],
  [38, 'Sr', 'Estrôncio',    '87,62',   'alkaline',    2,  5],
  [39, 'Y',  'Ítrio',        '88,91',   'transition',  3,  5],
  [40, 'Zr', 'Zircônio',     '91,22',   'transition',  4,  5],
  [41, 'Nb', 'Nióbio',       '92,91',   'transition',  5,  5],
  [42, 'Mo', 'Molibdênio',   '95,95',   'transition',  6,  5],
  [43, 'Tc', 'Tecnécio',     '(98)',    'transition',  7,  5],
  [44, 'Ru', 'Rutênio',      '101,1',   'transition',  8,  5],
  [45, 'Rh', 'Ródio',        '102,9',   'transition',  9,  5],
  [46, 'Pd', 'Paládio',      '106,4',   'transition',  10, 5],
  [47, 'Ag', 'Prata',        '107,9',   'transition',  11, 5],
  [48, 'Cd', 'Cádmio',       '112,4',   'transition',  12, 5],
  [49, 'In', 'Índio',        '114,8',   'post-trans',  13, 5],
  [50, 'Sn', 'Estanho',      '118,7',   'post-trans',  14, 5],
  [51, 'Sb', 'Antimônio',    '121,8',   'metalloid',   15, 5],
  [52, 'Te', 'Telúrio',      '127,6',   'metalloid',   16, 5],
  [53, 'I',  'Iodo',         '126,9',   'halogen',     17, 5],
  [54, 'Xe', 'Xenônio',      '131,3',   'noble',       18, 5],
  [55, 'Cs', 'Césio',        '132,9',   'alkali',      1,  6],
  [56, 'Ba', 'Bário',        '137,3',   'alkaline',    2,  6],
  [57, 'La', 'Lantânio',     '138,9',   'lanthanide',  3,  6],
  [72, 'Hf', 'Háfnio',       '178,5',   'transition',  4,  6],
  [73, 'Ta', 'Tântalo',      '180,9',   'transition',  5,  6],
  [74, 'W',  'Tungstênio',   '183,8',   'transition',  6,  6],
  [75, 'Re', 'Rênio',        '186,2',   'transition',  7,  6],
  [76, 'Os', 'Ósmio',        '190,2',   'transition',  8,  6],
  [77, 'Ir', 'Irídio',       '192,2',   'transition',  9,  6],
  [78, 'Pt', 'Platina',      '195,1',   'transition',  10, 6],
  [79, 'Au', 'Ouro',         '197,0',   'transition',  11, 6],
  [80, 'Hg', 'Mercúrio',     '200,6',   'transition',  12, 6],
  [81, 'Tl', 'Tálio',        '204,4',   'post-trans',  13, 6],
  [82, 'Pb', 'Chumbo',       '207,2',   'post-trans',  14, 6],
  [83, 'Bi', 'Bismuto',      '209,0',   'post-trans',  15, 6],
  [84, 'Po', 'Polônio',      '(209)',   'post-trans',  16, 6],
  [85, 'At', 'Astato',       '(210)',   'halogen',     17, 6],
  [86, 'Rn', 'Radônio',      '(222)',   'noble',       18, 6],
  [87, 'Fr', 'Frâncio',      '(223)',   'alkali',      1,  7],
  [88, 'Ra', 'Rádio',        '(226)',   'alkaline',    2,  7],
  [89, 'Ac', 'Actínio',      '(227)',   'actinide',    3,  7],
  [104,'Rf', 'Rutherfórdio', '(267)',   'transition',  4,  7],
  [105,'Db', 'Dúbnio',       '(268)',   'transition',  5,  7],
  [106,'Sg', 'Seabórgio',    '(269)',   'transition',  6,  7],
  [107,'Bh', 'Bóhrio',       '(270)',   'transition',  7,  7],
  [108,'Hs', 'Hássio',       '(277)',   'transition',  8,  7],
  [109,'Mt', 'Meitnério',    '(278)',   'unknown',     9,  7],
  [110,'Ds', 'Darmstádio',   '(281)',   'unknown',     10, 7],
  [111,'Rg', 'Roentgênio',   '(282)',   'unknown',     11, 7],
  [112,'Cn', 'Copernício',   '(285)',   'transition',  12, 7],
  [113,'Nh', 'Nihônio',      '(286)',   'unknown',     13, 7],
  [114,'Fl', 'Fleróvio',     '(289)',   'unknown',     14, 7],
  [115,'Mc', 'Moscóvio',     '(290)',   'unknown',     15, 7],
  [116,'Lv', 'Livermório',   '(293)',   'unknown',     16, 7],
  [117,'Ts', 'Tenesso',      '(294)',   'unknown',     17, 7],
  [118,'Og', 'Oganessônio',  '(294)',   'unknown',     18, 7],
  // Lantanídeos (período 8 no grid separado)
  [58, 'Ce', 'Cério',        '140,1',   'lanthanide',  4,  8],
  [59, 'Pr', 'Praseodímio',  '140,9',   'lanthanide',  5,  8],
  [60, 'Nd', 'Neodímio',     '144,2',   'lanthanide',  6,  8],
  [61, 'Pm', 'Promécio',     '(145)',   'lanthanide',  7,  8],
  [62, 'Sm', 'Samário',      '150,4',   'lanthanide',  8,  8],
  [63, 'Eu', 'Európio',      '152,0',   'lanthanide',  9,  8],
  [64, 'Gd', 'Gadolínio',    '157,3',   'lanthanide',  10, 8],
  [65, 'Tb', 'Térbio',       '158,9',   'lanthanide',  11, 8],
  [66, 'Dy', 'Disprósio',    '162,5',   'lanthanide',  12, 8],
  [67, 'Ho', 'Hólmio',       '164,9',   'lanthanide',  13, 8],
  [68, 'Er', 'Érbio',        '167,3',   'lanthanide',  14, 8],
  [69, 'Tm', 'Túlio',        '168,9',   'lanthanide',  15, 8],
  [70, 'Yb', 'Itérbio',      '173,0',   'lanthanide',  16, 8],
  [71, 'Lu', 'Lutécio',      '175,0',   'lanthanide',  17, 8],
  // Actinídeos (período 9 no grid separado)
  [90, 'Th', 'Tório',        '232,0',   'actinide',    4,  9],
  [91, 'Pa', 'Protactínio',  '231,0',   'actinide',    5,  9],
  [92, 'U',  'Urânio',       '238,0',   'actinide',    6,  9],
  [93, 'Np', 'Netúnio',      '(237)',   'actinide',    7,  9],
  [94, 'Pu', 'Plutônio',     '(244)',   'actinide',    8,  9],
  [95, 'Am', 'Amerício',     '(243)',   'actinide',    9,  9],
  [96, 'Cm', 'Cúrio',        '(247)',   'actinide',    10, 9],
  [97, 'Bk', 'Berquélio',    '(247)',   'actinide',    11, 9],
  [98, 'Cf', 'Califórnio',   '(251)',   'actinide',    12, 9],
  [99, 'Es', 'Einstênio',    '(252)',   'actinide',    13, 9],
  [100,'Fm', 'Férmio',       '(257)',   'actinide',    14, 9],
  [101,'Md', 'Mendelévio',   '(258)',   'actinide',    15, 9],
  [102,'No', 'Nobélio',      '(259)',   'actinide',    16, 9],
  [103,'Lr', 'Laurêncio',    '(266)',   'actinide',    17, 9],
];

// ─── Conteúdo de referência ───────────────────────────────────────────────────

const CONTENT = {
  ef1: {
    title: 'Ensino Fundamental I (1º – 5º ano)',
    color: 'organic',
    sections: [
      {
        title: 'Estados da Matéria',
        body: `Toda a matéria que nos rodeia existe em três estados principais:
<strong>Sólido</strong>: forma e volume definidos. Partículas muito próximas, vibrando no lugar. Ex: gelo, ferro, madeira.
<strong>Líquido</strong>: volume definido, forma variável (assume o formato do recipiente). Ex: água, leite, suco.
<strong>Gasoso</strong>: nem forma nem volume definidos — expande para ocupar todo o espaço disponível. Ex: vapor d'água, ar, fumaça.

<strong>Macete</strong>: pense nos estados como "abraços". No sólido as partículas se abraçam forte. No líquido, se abraçam com menos força. No gás, estão tão longe que mal se tocam.`,
      },
      {
        title: 'Mudanças de Estado',
        body: `A matéria muda de estado quando recebe ou perde calor:

• <strong>Fusão</strong>: sólido → líquido (gelo derrete)
• <strong>Solidificação</strong>: líquido → sólido (água congela)
• <strong>Vaporização</strong>: líquido → gás (água ferve e vira vapor)
• <strong>Condensação</strong>: gás → líquido (vapor na janela vira gotinhas)
• <strong>Sublimação</strong>: sólido → gás diretamente (gelo seco, naftalina)
• <strong>Deposição</strong>: gás → sólido diretamente (geada)

<strong>Macete da fusão</strong>: "FuSão — Faz Subir" (recebe calor). "SoLIdificação — Solta calor Lentamente, Fica Imóvel".`,
      },
      {
        title: 'Misturas e Substâncias Puras',
        body: `<strong>Substância pura</strong>: composta de um único tipo de partícula. Tem ponto de fusão e ebulição definidos. Ex: água pura (H₂O), ouro puro (Au), açúcar puro.

<strong>Mistura homogênea</strong>: parece uniforme, não se vê as partes. Ex: água com sal dissolvido, ar, bronze (liga metálica).

<strong>Mistura heterogênea</strong>: dá para ver as partes. Ex: água com areia, salada, granito.

<strong>Como separar misturas?</strong>
• Peneiração → partículas de tamanhos diferentes
• Filtração → sólido + líquido
• Decantação → líquidos imiscíveis ou sólido pesado + líquido
• Destilação → líquidos com pontos de ebulição diferentes
• Evaporação → sólido dissolvido + líquido`,
      },
      {
        title: 'Propriedades da Água',
        body: `A água (H₂O) é a substância mais importante para a vida:

• <strong>Ponto de fusão</strong>: 0 °C (1 atm)
• <strong>Ponto de ebulição</strong>: 100 °C (1 atm)
• <strong>Densidade</strong>: 1 g/mL a 4 °C
• <strong>Anomalia da água</strong>: o gelo (sólido) é menos denso que a água líquida — por isso flutua. A maioria dos sólidos afunda no próprio líquido.
• <strong>Solvente universal</strong>: dissolve mais substâncias que qualquer outro líquido.

<strong>Ciclo hidrológico</strong>: evaporação (lagos/oceanos) → condensação (nuvens) → precipitação (chuva/neve) → escoamento → infiltração → volta ao início.`,
      },
    ],
  },

  ef2: {
    title: 'Ensino Fundamental II (6º – 9º ano)',
    color: 'bond',
    sections: [
      {
        title: 'Átomos, Moléculas e Íons',
        body: `<strong>Átomo</strong>: menor parte de um elemento que mantém suas propriedades químicas. Composto por:
• <strong>Prótons</strong> (p⁺): carga positiva, no núcleo. Define o elemento (Z = número atômico).
• <strong>Nêutrons</strong> (n⁰): sem carga, no núcleo. Varia nos isótopos.
• <strong>Elétrons</strong> (e⁻): carga negativa, ao redor do núcleo, em camadas.

<strong>Notação</strong>: ¹²C₆ → número de massa A = 12 (prótons + nêutrons), Z = 6 (prótons).
Nêutrons = A - Z = 12 - 6 = 6.

<strong>Íon</strong>: átomo que ganhou ou perdeu elétrons.
• Cátion (+): perdeu elétrons. Ex: Na → Na⁺ + e⁻
• Ânion (-): ganhou elétrons. Ex: Cl + e⁻ → Cl⁻

<strong>Molécula</strong>: dois ou mais átomos unidos por ligações covalentes. Ex: H₂O, CO₂, NH₃.
<strong>Fórmula molecular</strong> indica quantidade de cada átomo: H₂SO₄ = 2 H, 1 S, 4 O.

<strong>Macete para lembrar cargas</strong>: "Os metais alcalinos sempre perdem 1 elétron (carga +1). Alcalinoterrosos perdem 2 (+2). Halogênios ganham 1 (-1). Calcogênios ganham 2 (-2)."`,
      },
      {
        title: 'Ligações Químicas',
        body: `<strong>Ligação iônica</strong>: transferência de elétrons entre metal e não metal. Forma cristais sólidos com alto ponto de fusão. Ex: NaCl (sal de cozinha).
Regra: metal + não metal → composto iônico.

<strong>Ligação covalente</strong>: compartilhamento de elétrons entre não metais. Pode ser simples (1 par), dupla (2 pares) ou tripla (3 pares).
• H-H: simples (σ)
• O=O: dupla (1σ + 1π)
• N≡N: tripla (1σ + 2π)

<strong>Ligação metálica</strong>: "mar de elétrons" — elétrons livres entre cátions metálicos. Explica condutividade elétrica, maleabilidade e brilho.

<strong>Regra do octeto</strong>: átomos tendem a completar 8 elétrons na camada de valência (exceto H → 2).

<strong>Eletronegatividade</strong> (Pauling): F > O > N > Cl > Br > S > C > H
Quanto maior a diferença, mais iônico o caráter da ligação.`,
      },
      {
        title: 'Funções Inorgânicas',
        body: `<strong>Ácidos (Arrhenius)</strong>: em água, liberam H⁺. Fórmula geral: HₓA.
Nomenclatura sem oxigênio: ácido + radical + ídrico. Ex: HCl = ácido clorídrico.
Com oxigênio: use o sufixo da quantidade de O. Mais O → oso/ico. Ainda mais → hipo.../per...
• HClO = ácido hipocloroso
• HClO₂ = ácido cloroso
• HClO₃ = ácido clórico
• HClO₄ = ácido perclórico

<strong>Bases (Arrhenius)</strong>: em água, liberam OH⁻. Fórmula: M(OH)ₙ.
Ex: NaOH (hidróxido de sódio), Ca(OH)₂ (hidróxido de cálcio = cal hidratada).

<strong>Sais</strong>: formados por ácido + base → sal + H₂O. Ex: HCl + NaOH → NaCl + H₂O.

<strong>Óxidos</strong>: composto de O com outro elemento. Ex: CO₂, Fe₂O₃, Na₂O.
• Óxidos ácidos (anidridos): CO₂, SO₃, P₂O₅ → reagem com água e formam ácidos.
• Óxidos básicos: Na₂O, CaO → reagem com água e formam bases.

<strong>pH</strong>: escala de 0 a 14.
pH < 7 → ácido | pH = 7 → neutro | pH > 7 → básico/alcalino.
pH = -log[H⁺]. Cada unidade de pH = 10× diferença de concentração.`,
      },
      {
        title: 'Reações Químicas',
        body: `Uma reação química transforma reagentes em produtos. Indicada pela seta (→).
<strong>Balancear</strong> é garantir que o número de átomos de cada elemento seja igual nos dois lados.

<strong>Tipos de reação</strong>:
• <strong>Síntese</strong>: A + B → AB. Ex: N₂ + 3H₂ → 2NH₃
• <strong>Análise (decomposição)</strong>: AB → A + B. Ex: 2H₂O → 2H₂ + O₂
• <strong>Simples troca</strong>: A + BC → AC + B. Ex: Zn + 2HCl → ZnCl₂ + H₂
• <strong>Dupla troca</strong>: AB + CD → AD + CB. Ex: NaCl + AgNO₃ → AgCl↓ + NaNO₃

<strong>Leis ponderais</strong>:
• Lavoisier: "Na natureza nada se cria, nada se perde, tudo se transforma." Massa dos reagentes = massa dos produtos.
• Proust: lei das proporções definidas — todo composto tem composição em massa fixa.

<strong>Indicadores de que ocorreu uma reação</strong>: formação de precipitado (↓), liberação de gás (↑), mudança de cor, produção de calor ou luz, mudança de odor.`,
      },
    ],
  },

  em: {
    title: 'Ensino Médio',
    color: 'electron',
    sections: [
      {
        title: 'Estequiometria e Mol',
        body: `<strong>Mol</strong>: unidade que representa 6,022 × 10²³ entidades (Número de Avogadro, Nₐ). Como uma "dúzia" química.

<strong>Fórmulas essenciais</strong>:
• Massa molar (M): M = massa (g) / n (mol) → massa = n × M
• Número de partículas: N = n × Nₐ
• Volume molar de gás (CNTP, 0 °C e 1 atm): Vm = 22,4 L/mol
• Volume molar (25 °C, 1 atm): Vm ≈ 24,5 L/mol

<strong>Procedimento de cálculo estequiométrico</strong>:
1. Escrever e balancear a equação
2. Identificar os coeficientes (proporção em moles)
3. Converter as grandezas dadas para moles
4. Usar proporção cruzada entre moles
5. Converter o resultado para a grandeza pedida

<strong>Rendimento</strong>: η = (quantidade real / quantidade teórica) × 100%
<strong>Reagente limitante</strong>: o que se esgota primeiro; determina a quantidade máxima de produto.
<strong>Reagente em excesso</strong>: sobra ao final da reação.

<strong>Pureza</strong>: massa pura = massa impura × (% pureza / 100)`,
      },
      {
        title: 'Termoquímica',
        body: `<strong>Entalpia (H)</strong>: conteúdo de energia de um sistema a pressão constante.
<strong>ΔH = H_produtos - H_reagentes</strong>
• ΔH < 0 → exotérmica (libera calor, esquenta o ambiente)
• ΔH > 0 → endotérmica (absorve calor, resfria o ambiente)

<strong>Lei de Hess</strong>: ΔH de uma reação não depende do caminho, só dos estados inicial e final. Permite calcular ΔH somando e subtraindo equações parciais.

<strong>Energia de ligação</strong>: ΔH ≈ Σ(ligações quebradas) - Σ(ligações formadas)
Quebrar ligação → absorve energia. Formar ligação → libera energia.

<strong>Entropia (S)</strong>: medida de desordem. ΔS > 0 → aumenta desordem.
<strong>Energia livre de Gibbs</strong>: ΔG = ΔH - TΔS
• ΔG < 0 → reação espontânea
• ΔG > 0 → não espontânea
• ΔG = 0 → equilíbrio

<strong>Macete Gibbs</strong>:
 ΔH < 0 e ΔS > 0 → sempre espontânea (ótimo!)
 ΔH > 0 e ΔS < 0 → nunca espontânea
 ΔH < 0 e ΔS < 0 → espontânea a baixa T
 ΔH > 0 e ΔS > 0 → espontânea a alta T`,
      },
      {
        title: 'Cinética Química e Equilíbrio',
        body: `<strong>Velocidade de reação</strong>: v = Δ[concentração] / Δt (mol/L·s)

<strong>Fatores que aumentam a velocidade</strong>:
• Temperatura (↑T → ↑v, regra geral: cada +10 °C dobra a velocidade)
• Concentração dos reagentes
• Superfície de contato (partículas menores)
• Catalisador (reduz energia de ativação Eₐ)

<strong>Equação de Arrhenius</strong>: k = A·e^(-Eₐ/RT)
• k = constante de velocidade
• Eₐ = energia de ativação (J/mol)
• R = 8,314 J/mol·K
• T = temperatura em kelvin

<strong>Equilíbrio químico</strong> (reação reversível A ⇌ B):
Constante de equilíbrio: Kc = [produtos]^coef / [reagentes]^coef
• Kc >> 1 → equilíbrio favorece produtos
• Kc << 1 → equilíbrio favorece reagentes

<strong>Princípio de Le Chatelier</strong>: se uma perturbação é aplicada ao sistema em equilíbrio, ele reage para minimizar o efeito:
• ↑concentração de reagente → equilíbrio desloca para produtos
• ↑temperatura: favorece a reação endotérmica
• ↑pressão: favorece o lado com menos moles de gás`,
      },
      {
        title: 'Eletroquímica',
        body: `<strong>Oxidação</strong>: perda de elétrons. Nox aumenta. Ocorre no ânodo (-).
<strong>Redução</strong>: ganho de elétrons. Nox diminui. Ocorre no cátodo (+).
<strong>Macete</strong>: "OIL RIG" → Oxidation Is Loss, Reduction Is Gain.
Ou em português: "CAR OA" → Cátodo Absorve Reduz; Ânodo Oxida.

<strong>Número de oxidação (Nox)</strong>:
• Elemento puro = 0
• H em compostos = +1 (exceto hidretos: -1)
• O em compostos = -2 (exceto H₂O₂: -1; OF₂: +2)
• Soma dos Nox em molécula = carga da espécie

<strong>Potencial padrão da célula</strong>: E°cel = E°(cátodo) - E°(ânodo)
• E°cel > 0 → reação espontânea (galvânica/pilha)
• E°cel < 0 → não espontânea (eletrólise necessária)

<strong>Leis de Faraday</strong>:
• 1ª: massa depositada ∝ carga total Q = i × t
• 2ª: massas depositadas por mesma carga ∝ M/n
• m = (M × i × t) / (n × F), onde F = 96.485 C/mol`,
      },
      {
        title: 'Gases',
        body: `<strong>Lei dos gases ideais</strong>: PV = nRT
• P = pressão (Pa ou atm)
• V = volume (m³ ou L)
• n = moles
• R = 8,314 J/mol·K = 0,082 atm·L/mol·K
• T = temperatura em Kelvin (K = °C + 273)

<strong>Leis combinadas</strong>:
• Boyle (T cte): P₁V₁ = P₂V₂
• Charles (P cte): V₁/T₁ = V₂/T₂
• Gay-Lussac (V cte): P₁/T₁ = P₂/T₂
• Combinada: P₁V₁/T₁ = P₂V₂/T₂

<strong>Misturas de gases — Dalton</strong>: P_total = P₁ + P₂ + ... + Pₙ
Pressão parcial: Pᵢ = xᵢ × P_total (xᵢ = fração molar)

<strong>Difusão — Graham</strong>: v₁/v₂ = √(M₂/M₁)
Gás mais leve difunde mais rápido.

<strong>CNTP</strong>: 0 °C (273 K) e 1 atm → 1 mol de gás ideal = 22,4 L
<strong>CATP</strong>: 25 °C (298 K) e 1 atm → 1 mol ≈ 24,5 L`,
      },
      {
        title: 'Química Orgânica — Fundamentos',
        body: `<strong>Carbono</strong>: 4 ligações, pode fazer cadeias longas, ramificadas, cíclicas.
• Carbono primário: ligado a 1 C
• Secundário: ligado a 2 C
• Terciário: ligado a 3 C
• Quaternário: ligado a 4 C

<strong>Principais funções orgânicas</strong>:
• Hidrocarbonetos: só C e H (alcanos -ane, alcenos -eno, alcinos -ino, aromáticos)
• Álcoois: -OH (metanol, etanol)
• Aldeídos: -CHO (metanal/formaldeído, etanal/acetaldeído)
• Cetonas: C=O entre carbonos (propanona/acetona)
• Ácidos carboxílicos: -COOH (ácido acético, fórmico)
• Ésteres: -COO- (odor de frutas; base de sabões via saponificação)
• Aminas: -NH₂ (cheiro forte, bases orgânicas)
• Amidas: -CONH₂ (ligação peptídica em proteínas)

<strong>Isomeria</strong>: mesma fórmula molecular, estrutura diferente.
• Plana: posição, cadeia, função, compensação, tautomeria
• Espacial: geométrica (cis/trans), óptica (enantiômeros — atividade óptica)

<strong>Macete IUPAC</strong>: 1-Conte a cadeia principal (mais longa com a função). 2-Numere pelo lado mais próximo da função. 3-Nome = prefixo(tamanho) + infixo(ligação) + sufixo(função).`,
      },
    ],
  },

  es: {
    title: 'Ensino Superior (Graduação)',
    color: 'reaction',
    sections: [
      {
        title: 'Termodinâmica Química',
        body: `<strong>1ª Lei</strong>: ΔU = Q - W (energia interna = calor absorvido - trabalho realizado)
Em processo a pressão constante: Q_p = ΔH

<strong>2ª Lei</strong>: a entropia total do universo aumenta em processos irreversíveis.
ΔS_universo = ΔS_sistema + ΔS_vizinhança ≥ 0

<strong>3ª Lei</strong>: S = 0 para cristal perfeito a T = 0 K (escala absoluta de entropia).

<strong>Funções termodinâmicas</strong>:
• Energia de Gibbs: G = H - TS → ΔG = ΔH - TΔS
• Energia de Helmholtz: A = U - TS (volume constante)
• Entalpia: H = U + PV

<strong>Relação com constante de equilíbrio</strong>:
ΔG° = -RT ln K → K = e^(-ΔG°/RT)

<strong>Equação de van't Hoff</strong>:
ln(K₂/K₁) = -(ΔH°/R)·(1/T₂ - 1/T₁)
Permite calcular K em outra temperatura se ΔH° é conhecido.

<strong>Fugacidade e atividade</strong>:
Para gases reais: μ = μ° + RT ln(f/f°), onde f = fugacidade.
Para soluções: μ = μ° + RT ln(a), onde a = atividade (≈ concentração para soluções ideais).`,
      },
      {
        title: 'Mecânica Quântica Aplicada à Química',
        body: `<strong>Equação de Schrödinger</strong>: Ĥψ = Eψ
• Ĥ = operador hamiltoniano (energia cinética + potencial)
• ψ = função de onda (orbital)
• E = energia do estado

<strong>Números quânticos</strong>:
• n: principal (tamanho/energia). n = 1, 2, 3...
• l: azimutal/angular (forma). l = 0 (s), 1 (p), 2 (d), 3 (f)
• mₗ: magnético (orientação). mₗ = -l ... 0 ... +l
• mₛ: spin. mₛ = +1/2 ou -1/2

<strong>Princípios</strong>:
• Aufbau: elétrons ocupam os orbitais de menor energia primeiro.
• Pauli: dois elétrons no mesmo orbital devem ter spins opostos.
• Hund: orbitais degenerados são ocupados um a um antes de emparelhar.

<strong>Ordem de preenchimento</strong>: 1s 2s 2p 3s 3p 4s 3d 4p 5s 4d 5p 6s 4f 5d 6p...
<strong>Macete da diagonal de Klechkowski</strong>: preencha na ordem das diagonais na tabela n×l.

<strong>Orbitais moleculares (TOM)</strong>: ψ_mol = c₁ψ_A + c₂ψ_B (LCAO).
Orbital ligante (σ): energia menor que AOs originais. Antiligante (σ*): energia maior.
Ordem de ligação = (e⁻ ligantes - e⁻ antiligantes) / 2`,
      },
      {
        title: 'Cinética Química Avançada',
        body: `<strong>Lei de velocidade</strong>: v = k[A]^m[B]^n
m, n = ordens parciais (determinadas experimentalmente, não pelos coeficientes).
Ordem total = m + n.

<strong>Meias-vidas por ordem</strong>:
• Ordem 0: t½ = [A]₀ / (2k)
• Ordem 1: t½ = ln2 / k (independente da concentração!)
• Ordem 2: t½ = 1 / (k[A]₀)

<strong>Integração para ordem 1</strong>: ln[A] = ln[A]₀ - kt → gráfico ln[A] vs t é linear.
<strong>Ordem 2</strong>: 1/[A] = 1/[A]₀ + kt → gráfico 1/[A] vs t é linear.

<strong>Teoria do estado de transição (Eyring)</strong>:
k = (kᵦT/h)·e^(ΔG‡/RT) = (kᵦT/h)·e^(ΔS‡/R)·e^(-ΔH‡/RT)
• kᵦ = constante de Boltzmann = 1,38 × 10⁻²³ J/K
• h = constante de Planck = 6,63 × 10⁻³⁴ J·s
• ΔG‡ = energia de Gibbs de ativação

<strong>Catálise enzimática — Michaelis-Menten</strong>:
v = Vmax[S] / (Km + [S])
• Vmax = velocidade máxima (todos os sítios ocupados)
• Km = concentração de substrato para v = Vmax/2
• Inibição competitiva: aumenta Km aparente; Vmax não muda.`,
      },
      {
        title: 'Espectroscopia',
        body: `<strong>Lei de Beer-Lambert</strong>: A = ε·c·l
• A = absorbância (adimensional)
• ε = absortividade molar (L/mol·cm)
• c = concentração (mol/L)
• l = caminho óptico (cm)

<strong>Regiões do espectro eletromagnético</strong> (energia crescente):
Rádio → Micro-ondas → IV → Visível (750–400 nm) → UV → Raios-X → Gama

<strong>Espectroscopia IV (infravermelho)</strong>: modos vibracionais de ligações.
Região de impressão digital: 400–1500 cm⁻¹.
Grupos diagnósticos: O-H (3200–3600 cm⁻¹), C=O (1700–1750 cm⁻¹), C≡N (~2200 cm⁻¹).

<strong>RMN ¹H</strong>: deslocamento químico δ (ppm) relativo ao TMS.
• TMS (referência): δ = 0 ppm
• CH₃ (alquil): δ ≈ 0,9 ppm
• Ar-H (aromático): δ 6,5–8,5 ppm
• COOH: δ ≈ 12 ppm
Acoplamento J (Hz): indica vizinhos. Regra n+1: n vizinhos → n+1 picos.

<strong>Espectrometria de massas</strong>:
Pico do íon molecular (M⁺): dá a massa molar.
Fragmentos: indicam a estrutura. Pico base: fragmento mais abundante.`,
      },
      {
        title: 'Equilíbrio em Solução',
        body: `<strong>Produto iônico da água</strong>: Kw = [H⁺][OH⁻] = 10⁻¹⁴ a 25 °C
pH = -log[H⁺] | pOH = -log[OH⁻] | pH + pOH = 14

<strong>Ácidos e bases — Brønsted-Lowry</strong>: ácido doa H⁺; base acepta H⁺. Par conjugado: HA/A⁻.
<strong>Lewis</strong>: ácido aceita par de elétrons; base doa par de elétrons. Mais geral.

<strong>Constantes de acidez</strong>:
Ka = [H⁺][A⁻] / [HA] | pKa = -log(Ka)
Ácido forte: Ka >> 1 (pKa << 0). Ácido fraco: Ka < 1.
Relação conjugado: Ka × Kb = Kw → pKa + pKb = 14

<strong>Soluções tampão — Henderson-Hasselbalch</strong>:
pH = pKa + log([A⁻]/[HA])
Capacidade tampão máxima: pH = pKa ± 1 (razão entre 0,1 e 10).

<strong>Produto de solubilidade</strong>: Ksp = [M^m+]^a [X^n-]^b
• Q < Ksp → solução insaturada (dissolve mais)
• Q = Ksp → saturada (equilíbrio)
• Q > Ksp → supersaturada (precipita)
Efeito do íon comum: adicionar íon em comum reduz a solubilidade.`,
      },
    ],
  },
};

// ─── Render principal ─────────────────────────────────────────────────────────

export function renderReference(outlet) {

  // Montar sidebar
  const sidebarLinks = [
    { id: 'ref-ef1', label: 'EF I (1–5º ano)' },
    { id: 'ref-ef2', label: 'EF II (6–9º ano)' },
    { id: 'ref-em',  label: 'Ensino Médio' },
    { id: 'ref-es',  label: 'Ensino Superior' },
    { id: 'ref-pt',  label: 'Tabela Periódica' },
  ].map(s => `<a href="#${s.id}" class="teacher-sidebar-link">${esc(s.label)}</a>`).join('');

  // Montar blocos de conteúdo
  function renderLevel(key, data) {
    const colorVar = {
      organic:  'var(--accent-organic)',
      bond:     'var(--accent-bond)',
      electron: 'var(--accent-electron)',
      reaction: 'var(--accent-reaction)',
    }[data.color] || 'var(--accent-electron)';

    const sections = data.sections.map(s => `
      <h3 class="ref-subsection-title">${esc(s.title)}</h3>
      <div class="ref-body">${s.body.replace(/\n/g, '<br>')}</div>
    `).join('');

    return `
<section class="teacher-section ref-level-section" id="ref-${key}">
  <div class="ref-level-header" style="border-left-color:${colorVar}">
    <span class="ref-level-badge" style="background:${colorVar}22;color:${colorVar};border-color:${colorVar}55">
      ${esc(data.title)}
    </span>
  </div>
  ${sections}
</section>`;
  }

  // Montar tabela periódica
  const ptHtml = buildPeriodicTable();

  outlet.innerHTML = `
<div class="teacher-page" id="reference-page">
  <div class="teacher-layout">

    <!-- Sidebar -->
    <aside class="teacher-sidebar" aria-label="Navegação da referência">
      <div class="teacher-sidebar-panel">
        <div class="teacher-sidebar-group">Por nível</div>
        ${sidebarLinks}
      </div>
    </aside>

    <!-- Conteúdo -->
    <main class="teacher-content">
      <header class="teacher-content-header">
        <h1>Referência Rápida de Química</h1>
        <p class="teacher-lead">
          Fórmulas, definições, macetes e regras essenciais organizados por nível de ensino.
          Do Ensino Fundamental ao Superior.
        </p>
      </header>

      ${renderLevel('ef1', CONTENT.ef1)}
      ${renderLevel('ef2', CONTENT.ef2)}
      ${renderLevel('em',  CONTENT.em)}
      ${renderLevel('es',  CONTENT.es)}

      <!-- Tabela Periódica -->
      <section class="teacher-section" id="ref-pt">
        <h2 class="teacher-h2">Tabela Periódica Completa</h2>
        ${ptHtml}
      </section>

    </main>
  </div>
</div>

<style>
.ref-level-section { margin-bottom: var(--space-14, 3.5rem); }
.ref-level-header {
  border-left: 4px solid var(--accent-electron);
  padding-left: var(--space-4);
  margin-bottom: var(--space-6);
}
.ref-level-badge {
  display: inline-block;
  font-size: 0.8125rem;
  font-weight: 700;
  padding: 0.3rem 0.8rem;
  border-radius: 6px;
  border: 1px solid;
  letter-spacing: 0.02em;
}
.ref-subsection-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--accent-electron);
  margin: var(--space-7) 0 var(--space-3);
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-subtle);
}
.ref-body {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.8;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: var(--space-5);
}
.ref-body strong { color: var(--text-primary); }

/* ── Tabela Periódica ──────────────────────────────────────────────────── */
.pt-wrap {
  overflow-x: auto;
  padding-bottom: var(--space-4);
}
.pt-grid {
  display: grid;
  grid-template-columns: repeat(18, 52px);
  grid-template-rows: repeat(7, 56px);
  gap: 3px;
  min-width: 954px;
}
.pt-el {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: default;
  transition: transform .12s, box-shadow .12s;
  padding: 2px;
  position: relative;
  border: 1px solid rgba(0,0,0,0.25);
}
.pt-el:hover {
  transform: scale(1.18);
  z-index: 10;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.pt-el-z   { font-size: 8px; line-height: 1; color: rgba(255,255,255,0.75); align-self: flex-start; margin-left: 3px; }
.pt-el-sym { font-size: 16px; font-weight: 700; color: #fff; line-height: 1.2; }
.pt-el-name{ font-size: 6px; color: rgba(255,255,255,0.8); text-align: center; line-height: 1.2; }
.pt-el-mass{ font-size: 6px; color: rgba(255,255,255,0.65); }

.pt-row-gap { grid-column: 1 / -1; height: 8px; }
.pt-f-block {
  display: grid;
  grid-template-columns: repeat(14, 52px);
  grid-template-rows: repeat(2, 52px);
  gap: 3px;
  margin-top: 6px;
  margin-left: calc(52px * 2 + 3px * 2 + 2px);
}

.pt-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: var(--space-6);
}
.pt-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}
.pt-legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.25);
}

.pt-placeholder {
  background: rgba(255,255,255,0.04);
  border: 1px dashed rgba(255,255,255,0.1);
  border-radius: 4px;
}
.pt-label-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 4px;
  font-size: 8px;
  color: var(--text-muted);
  font-style: italic;
}
</style>`;

  // Smooth scroll nos links da sidebar
  outlet.querySelectorAll('.teacher-sidebar-link[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ─── Construção da Tabela Periódica ──────────────────────────────────────────

function buildPeriodicTable() {
  // Indexar elementos por (grupo, período)
  const byPos = new Map();
  for (const el of ELEMENTS) {
    const [z, sym, name, mass, cat, grp, per] = el;
    if (per <= 7) {
      byPos.set(`${grp},${per}`, { z, sym, name, mass, cat });
    }
  }

  // Elementos da série f (per 8 e 9) em ordem de grupo (4..17)
  const fblock = ELEMENTS.filter(e => e[6] === 8 || e[6] === 9)
    .sort((a, b) => (a[6] - b[6]) || (a[5] - b[5]));

  function elCell(el, extraStyle = '') {
    const color = CATEGORIES[el.cat]?.color || '#555';
    return `<div class="pt-el" style="background:${color};${extraStyle}" title="${esc(el.name)} (${el.z}) — ${el.mass}">
      <span class="pt-el-z">${el.z}</span>
      <span class="pt-el-sym">${esc(el.sym)}</span>
      <span class="pt-el-name">${esc(el.name)}</span>
      <span class="pt-el-mass">${esc(el.mass)}</span>
    </div>`;
  }

  function placeholder() {
    return `<div class="pt-placeholder"></div>`;
  }

  // Montar o grid principal (períodos 1-7, grupos 1-18)
  let rows = '';
  for (let per = 1; per <= 7; per++) {
    for (let grp = 1; grp <= 18; grp++) {
      const key = `${grp},${per}`;
      const el = byPos.get(key);
      if (el) {
        // Período 6, grupo 3 = La (marcador de lantanídeos)
        // Período 7, grupo 3 = Ac (marcador de actinídeos)
        rows += elCell(el);
      } else if (
        // Lacunas nos períodos 1 (grupos 2-17), 2-3 (grupos 3-12)
        (per === 1 && grp >= 2 && grp <= 17) ||
        (per === 2 && grp >= 3 && grp <= 12) ||
        (per === 3 && grp >= 3 && grp <= 12)
      ) {
        rows += placeholder();
      } else {
        rows += placeholder();
      }
    }
  }

  // Bloco f (lantanídeos período 8, actinídeos período 9)
  // Período 8: La já está no grid como elemento 57; Ce-Lu são grupos 4-17 período 8
  // Período 9: Ac já está no grid como elemento 89; Th-Lr são grupos 4-17 período 9
  const lanthanides = fblock.filter(e => e[6] === 8)
    .sort((a, b) => a[5] - b[5])
    .map(e => elCell({ z: e[0], sym: e[1], name: e[2], mass: e[3], cat: e[4] }))
    .join('');
  const actinides = fblock.filter(e => e[6] === 9)
    .sort((a, b) => a[5] - b[5])
    .map(e => elCell({ z: e[0], sym: e[1], name: e[2], mass: e[3], cat: e[4] }))
    .join('');

  // Legenda
  const legend = Object.entries(CATEGORIES).map(([key, val]) =>
    `<div class="pt-legend-item">
      <div class="pt-legend-swatch" style="background:${val.color}"></div>
      <span>${esc(val.label)}</span>
    </div>`
  ).join('');

  return `
<div class="pt-wrap">
  <div class="pt-grid">${rows}</div>
  <div class="pt-f-block">${lanthanides}${actinides}</div>
  <div class="pt-legend">${legend}</div>
</div>`;
}
