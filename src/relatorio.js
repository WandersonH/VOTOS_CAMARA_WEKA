const fs = require('fs');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, HeadingLevel, ImageRun, AlignmentType, BorderStyle, LevelFormat, Footer, PageNumber } = D;
const R = JSON.parse(fs.readFileSync('dados/resultados.json')), M = JSON.parse(fs.readFileSync('dados/metadados.json'));
const F = 'Arial', W = 9026;
const pct = v => v.toFixed(2).replace('.', ',') + '%', num = (v, d = 3) => v.toFixed(d).replace('.', ',');
const p = (t, o = {}) => new Paragraph({ spacing: { after: 140, line: 300 }, alignment: o.align, children: (Array.isArray(t) ? t : [t]).map(x => typeof x === 'string' ? new TextRun({ text: x, font: F, size: 22 }) : x) });
const b = t => new TextRun({ text: t, font: F, size: 22, bold: true });
const mono = t => new TextRun({ text: t, font: 'Courier New', size: 19 });
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, font: F })] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, font: F })] });
const li = t => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 80, line: 290 }, children: (Array.isArray(t) ? t : [t]).map(x => typeof x === 'string' ? new TextRun({ text: x, font: F, size: 22 }) : x) });
const code = lines => lines.map(l => new Paragraph({ spacing: { after: 0 }, shading: { type: ShadingType.CLEAR, fill: 'F2F4F7' }, children: [mono(l)] }));
const cap = t => new Paragraph({ spacing: { before: 60, after: 220 }, children: [new TextRun({ text: t, font: F, size: 18, italics: true, color: '555555' })] });
const brd = { style: BorderStyle.SINGLE, size: 4, color: 'C9CED6' }, borders = { top: brd, bottom: brd, left: brd, right: brd };
function table(head, rows, widths, hl = -1) {
  const cell = (t, w, o = {}) => new TableCell({ width: { size: w, type: WidthType.DXA }, borders, margins: { top: 60, bottom: 60, left: 90, right: 90 },
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
    children: [new Paragraph({ alignment: o.right ? AlignmentType.RIGHT : AlignmentType.LEFT, children: [new TextRun({ text: String(t), font: F, size: 18, bold: !!o.bold })] })] });
  const isNum = t => /^-?[\d.,]+%?s?$/.test(String(t));
  return new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: widths, rows: [
    new TableRow({ tableHeader: true, children: head.map((t, i) => cell(t, widths[i], { bold: true, fill: 'DDE5EF' })) }),
    ...rows.map((r, k) => new TableRow({ children: r.map((t, i) => cell(t, widths[i], { right: isNum(t), bold: k === hl, fill: k === hl ? 'EEF3FA' : undefined })) })) ] });
}
const img = (f, w, h) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120 }, children: [new ImageRun({ type: 'png', data: fs.readFileSync('figuras/' + f), transformation: { width: w, height: h } })] });
const expRows = g => R[g].map(r => [r.H, String(r.L).replace('.', ','), r.N, pct(r.treino.acerto), pct(r.cv.acerto), num(r.cv.kappa), num(r.cv.rmse)]);
const EH = ['hiddenLayers', 'learningRate', 'trainingTime', 'Acerto no treino', 'Acerto na validação cruzada', 'Kappa', 'RMSE'], EW = [1300, 1400, 1400, 1300, 1576, 1000, 1050];
const bestOf = g => R[g].reduce((a, r, i) => r.cv.acerto > R[g][a].cv.acerto ? i : a, 0);
const best = R.combinada[bestOf('combinada')], U = M.universo, cls = M.classes;
const body = [
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Inteligência Artificial · Trabalho Prático de Redes Neurais (WEKA)', font: F, size: 20, color: '555555' })] }),
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Uma rede MLP consegue identificar o partido de um deputado pelos seus votos?', font: F, size: 40, bold: true })] }),
  p('Classificação de deputados federais por partido a partir de votações nominais da Câmara dos Deputados em 2025.'),
  p([b('Aluno: '), 'Wanderson Honorio Roberto da Silva']), p([b('Professora: '), 'Profa. Dra. Jaqueline Brigladori Pugliesi']),
  p([b('Arquivos entregues: '), 'camara_votacoes_2025.arff e este relatório.']),

  h1('1. Resumo'),
  p(`Treinei uma rede neural MLP (Multilayer Perceptron) no Weka para prever o partido de um deputado federal a partir de como ele votou em 20 votações nominais do Plenário em 2025. A base tem ${M.instancias} deputados dos 7 maiores partidos. A melhor rede acertou ${pct(best.cv.acerto)} na validação cruzada (${best.cv.corretos} de ${M.instancias}), contra ${pct(R.outros.ZeroR.cv.acerto)} de quem sempre chuta o maior partido.`),
  p('O resultado mais interessante está na matriz de confusão: a rede reconhece todos os deputados do PT e 84% dos do PL, mas confunde entre si os partidos do centro (União, PP, PSD e MDB), que votam de forma parecida. Ajustar arquitetura, taxa de aprendizado e tempo de treinamento mudou muito o acerto no conjunto de treino e pouco o acerto na validação cruzada.'),

  h1('2. Domínio'),
  p('O domínio é o comportamento de voto na Câmara dos Deputados. A ideia vem da base clássica de votações do Congresso dos Estados Unidos (UCI), em que o voto em 16 projetos indica se o parlamentar é democrata ou republicano. Aqui a mesma pergunta é feita com dados brasileiros, em que o problema é mais difícil: são muitos partidos e vários deles votam juntos.'),
  p([b('Tarefa: '), 'classificação. ', b('Entrada: '), '20 votos (Sim ou Não). ', b('Saída: '), 'o partido do deputado, entre 7 classes.']),

  h1('3. Dados e representação no formato do Weka'),
  h2('3.1 Fonte, universo e amostra'),
  p('Os dados vêm do portal Dados Abertos da Câmara dos Deputados (dadosabertos.camara.leg.br), arquivos votacoesVotos-2025.csv, votacoes-2025.csv e votacoesProposicoes-2025.csv.'),
  table(['Etapa', 'Quantidade'], [
    ['Universo: votos nominais registrados em 2025', U.linhas_de_voto_2025.toLocaleString('pt-BR')],
    ['Universo: votações com voto nominal em 2025', U.votacoes_com_voto_nominal_2025],
    ['Universo: deputados com ao menos um voto em 2025', U.deputados_com_voto_2025],
    ['Votações do Plenário disputadas (380 votos ou mais e minoria de pelo menos 20%)', 228],
    ['Amostra: votações escolhidas como atributos', 20],
    ['Deputados com voto em alguma das 20 votações', M.deputados_nas_20_votacoes],
    [`Deputados com Sim ou Não em pelo menos ${M.min_votos} das 20`, M.deputados_com_min_votos],
    ['Amostra final: deputados dos 7 maiores partidos (instâncias do .arff)', M.instancias]], [7026, 2000], 7),
  cap('Tabela 1. Do universo à amostra usada no treinamento.'),
  p('Escolhi as 20 votações entre as 228 disputadas procurando temas variados e textos principais (projetos, PECs, urgências e pareceres), em vez de destaques repetidos do mesmo projeto. A escolha foi manual, o que é uma limitação: outro conjunto de votações pode dar resultados diferentes.'),
  h2('3.2 Atributos'),
  p(`Cada atributo é o voto do deputado em uma votação, com os valores Sim e Nao. Ausência, abstenção, obstrução e "art. 17" foram gravados como valor faltante (?). São ${M.faltantes.toLocaleString('pt-BR')} valores faltantes em ${M.celulas.toLocaleString('pt-BR')} células (${(100 * M.faltantes / M.celulas).toFixed(1).replace('.', ',')}%).`),
  table(['Atributo', 'Proposição', 'Data', 'Sim', 'Não'], M.votacoes.map(v => [v.atributo, v.proposicao.replace(/ \(.*/, '') || 'PL 3224/2024', v.data.split('-').reverse().join('/'), v.sim_amostra, v.nao_amostra]), [4426, 1700, 1300, 800, 800]),
  cap(`Tabela 2. Os 20 atributos. Sim e Não contam os votos dentro da amostra de ${M.instancias} deputados. A ementa de cada proposição está no arquivo metadados.json do repositório.`),
  h2('3.3 Classe'),
  table(['Partido (classe)', 'Deputados', '% da amostra'], cls.map(c => [c.classe, c.n, pct(100 * c.n / M.instancias)]), [4026, 2500, 2500]),
  cap('Tabela 3. Distribuição das 7 classes. O partido é o que aparece com mais frequência nos votos do deputado em 2025.'),
  p(`Ficaram de fora os partidos menores (${M.partidos_fora.map(x => x.partido).join(', ')}), que somam ${M.partidos_fora.reduce((a, x) => a + x.n, 0)} deputados, porque teriam poucos exemplos por classe.`),
  h2('3.4 Trecho do arquivo .arff'),
  ...code(['@RELATION camara_votacoes_2025', '', '@ATTRIBUTE pec_prerrogativas_1turno {Sim,Nao}', '@ATTRIBUTE pl_antifaccao_substitutivo {Sim,Nao}', '... (20 atributos de voto)', '@ATTRIBUTE partido {PL,PT,UNIAO,PP,REPUBLICANOS,PSD,MDB}', '', '@DATA', ...fs.readFileSync('entrega/camara_votacoes_2025.arff', 'utf8').split('@DATA\n')[1].split('\n').slice(0, 3).map(l => l.slice(0, 58) + ',...'), '... (388 linhas, uma por deputado)']),
  cap('O arquivo completo acompanha este relatório.'),

  h1('4. Algoritmo de treinamento'),
  p('Usei o classificador weka.classifiers.functions.MultilayerPerceptron, que treina a rede por retropropagação do erro (backpropagation) com neurônios sigmoides. O Weka converte cada atributo nominal de dois valores em uma entrada numérica, então a rede tem 20 entradas e 7 saídas (uma por partido).'),
  li([b('Avaliação: '), 'validação cruzada estratificada de 10 partes (semente 1), além do acerto no próprio conjunto de treino, para medir o sobreajuste.']),
  li([b('Parâmetros fixos: '), 'momentum 0,2, normalização de atributos ligada, sem conjunto de validação (validationSetSize 0).']),
  li([b('Parâmetros ajustados: '), 'hiddenLayers (arquitetura), learningRate (taxa de aprendizado) e trainingTime (épocas).']),
  li([b('Versão: '), 'Weka 3.9.7, executado pela linha de comando com as mesmas opções da tela do Explorer.']),
  p(`Com ${M.instancias} exemplos, a margem de erro de um acerto próximo de 65% é de cerca de 2,4 pontos percentuais (um erro-padrão). Diferenças menores que isso entre duas configurações não permitem dizer que uma é melhor que a outra.`),

  h1('5. Arquitetura da rede'),
  p('Segui as duas sugestões da aula para o número de neurônios da camada oculta, com 20 atributos e 7 classes:'),
  li('(atributos + classes) / 2 = (20 + 7) / 2 = 13,5, arredondado para 13 (é o valor "a" do Weka).'),
  li('2/3 dos atributos + classes = 20 × 2/3 + 7 = 20,33, arredondado para 21.'),
  li('Segunda camada oculta, a partir da primeira: (13 + 7) / 2 = 10 e (21 + 7) / 2 = 14.'),
  p('Testei também a rede sem camada oculta (0), camadas menores (5 e 10), a soma de atributos e classes (27) e uma rede com três camadas ocultas.'),
  table(EH, expRows('arquitetura'), EW, bestOf('arquitetura')), cap('Tabela 4. Arquiteturas testadas com taxa de aprendizado 0,3 e 500 épocas. Em destaque, o maior acerto na validação cruzada.'),
  img('fig1_arquitetura.png', 520, 260), cap('Figura 1. Mais neurônios aumentam o acerto no treino, mas não o acerto na validação cruzada.'),
  p('Aumentar a rede fez o acerto no treino subir de 74,7% para até 93,8%, enquanto a validação cruzada ficou entre 57% e 63%. As redes com uma camada oculta ficaram dentro da margem de erro umas das outras, e a rede sem camada oculta (62,1%) empatou com elas. A rede com três camadas foi a pior (57,2%). Mantive 13 neurônios em uma camada, a sugestão da aula, para os experimentos seguintes.'),

  h1('6. Taxa de aprendizado'),
  table(EH, expRows('taxa'), EW, bestOf('taxa')), cap('Tabela 5. Taxas de aprendizado testadas com 13 neurônios ocultos e 500 épocas.'),
  img('fig2_taxa.png', 520, 260), cap('Figura 2. Taxas menores erram mais no treino e acertam mais na validação cruzada.'),
  p('Este foi o parâmetro que mais influenciou o resultado. Com taxa 0,01 a rede acertou 66,2% na validação cruzada e teve o menor erro (RMSE 0,259); com 0,9 caiu para 60,3%. Taxas altas fazem a rede decorar mais depressa os exemplos de treino. A diferença entre os extremos (cerca de 6 pontos) é maior que a margem de erro.'),

  h1('7. Tempo de treinamento'),
  table(EH, expRows('tempo'), EW, bestOf('tempo')), cap('Tabela 6. Número de épocas testado com 13 neurônios ocultos e taxa 0,3.'),
  img('fig3_tempo.png', 520, 260), cap('Figura 3. Treinar por mais tempo só melhora o acerto no conjunto de treino.'),
  p('Com taxa 0,3, a rede já chega perto do seu limite na validação cruzada com 50 épocas (64,4%). De 50 a 5.000 épocas o acerto no treino sobe de 81,7% para 90,7% e a validação cruzada cai aos poucos até 61,6%, com o RMSE piorando de 0,274 para 0,317. É o comportamento típico de sobreajuste: mais treino faz a rede memorizar os deputados do conjunto de treino.'),

  h1('8. Melhor configuração'),
  p('Combinei a melhor taxa de aprendizado (0,01) com diferentes tamanhos de rede e tempos de treinamento:'),
  table(EH, expRows('combinada'), EW, bestOf('combinada')), cap('Tabela 7. Combinações com taxa de aprendizado 0,01.'),
  p([b(`Configuração escolhida: hiddenLayers ${best.H}, learningRate ${String(best.L).replace('.', ',')}, trainingTime ${best.N}. `), `Acerto de ${pct(best.cv.acerto)} na validação cruzada (${best.cv.corretos} de ${M.instancias}), Kappa ${num(best.cv.kappa)} e RMSE ${num(best.cv.rmse)}. Com taxa baixa, a rede de 5 neurônios ainda não tinha terminado de aprender em 500 épocas, por isso ficou abaixo.`]),
  img('fig4_matriz_confusao.png', 470, 313), cap('Figura 4. Linhas são o partido real e colunas o partido previsto. A diagonal são os acertos.'),
  table(['Partido', 'Deputados', 'Precisão', 'Recall', 'F1'], best.por_classe.map((c, i) => [c.classe, cls[i].n, c.precisao.replace('.', ','), c.recall.replace('.', ','), c.f1.replace('.', ',')]), [3026, 1500, 1500, 1500, 1500]),
  cap('Tabela 8. Desempenho por partido da configuração escolhida (validação cruzada).'),
  li('PT: os 67 deputados foram reconhecidos (recall 1,000). É o partido com voto mais coeso e mais diferente dos demais nessas votações.'),
  li('PL: 72 de 86 reconhecidos. Os erros vão quase todos para União e PP.'),
  li('Republicanos: 32 de 43, um resultado bom para um partido de centro.'),
  li('União, PP e PSD: cerca de metade de acertos, com confusão entre eles e com o PL.'),
  li('MDB: só 8 de 41 reconhecidos. A rede classifica 12 deputados do MDB como PSD, o que indica que os dois partidos votaram de forma muito parecida nessas 20 votações.'),

  h1('9. Comparação com outros algoritmos'),
  table(['Algoritmo', 'Acerto no treino', 'Acerto na validação cruzada', 'Kappa'], [
    ['ZeroR (sempre o maior partido)', pct(R.outros.ZeroR.treino.acerto), pct(R.outros.ZeroR.cv.acerto), num(R.outros.ZeroR.cv.kappa)],
    ['J48 (árvore de decisão)', pct(R.outros.J48.treino.acerto), pct(R.outros.J48.cv.acerto), num(R.outros.J48.cv.kappa)],
    ['Naive Bayes', pct(R.outros.NaiveBayes.treino.acerto), pct(R.outros.NaiveBayes.cv.acerto), num(R.outros.NaiveBayes.cv.kappa)],
    [`MLP escolhida (${best.H}; ${String(best.L).replace('.', ',')}; ${best.N})`, pct(best.treino.acerto), pct(best.cv.acerto), num(best.cv.kappa)]], [3826, 1700, 2200, 1300], 3),
  cap('Tabela 9. Mesma base e mesma validação cruzada, com os parâmetros padrão do Weka para os outros algoritmos.'),
  p('A MLP triplica o acerto do ZeroR, mas fica dentro da margem de erro do Naive Bayes (64,4%) e pouco acima do J48 (61,3%). Três algoritmos bem diferentes param perto dos mesmos 61% a 66%, o que sugere que o limite está nos dados e não na rede: com essas 20 votações, parte dos deputados de partidos diferentes tem exatamente o mesmo padrão de voto.'),

  h1('10. Conclusões'),
  li('A rede aprendeu o que os dados permitem: separa bem os partidos dos dois polos (PT e PL) e mal os partidos de centro, que votam juntos.'),
  li('A taxa de aprendizado foi o ajuste que mais importou. Taxa baixa (0,01) deu o melhor resultado.'),
  li('Mais neurônios, mais camadas e mais épocas aumentaram o acerto no treino (até 93,8%) sem melhorar a generalização. A rede sem camada oculta já chega a 62%.'),
  li('A regra da aula para a camada oculta, (atributos + classes) / 2 = 13, funcionou tão bem quanto as alternativas.'),
  li('Limitações: 388 exemplos são poucos para 7 classes; as 20 votações foram escolhidas manualmente; o partido é uma classe imperfeita, porque há deputados que votam diferente da própria bancada.'),
  li('Próximos passos possíveis: usar mais votações como atributos, agrupar partidos em blocos ou tratar obstrução como um valor próprio.'),

  h1('11. Como reproduzir no Weka'),
  li('Abrir o Weka Explorer e, em Preprocess, clicar em Open file e escolher camara_votacoes_2025.arff.'),
  li('Na aba Classify, clicar em Choose e selecionar functions > MultilayerPerceptron.'),
  li(`Clicar no nome do classificador e preencher hiddenLayers = ${best.H}, learningRate = ${String(best.L).replace('.', ',')} e trainingTime = ${best.N}. Deixar momentum em 0,2.`),
  li('Em Test options, manter Cross-validation com Folds = 10 e clicar em Start.'),
  li([`O resultado esperado é "Correctly Classified Instances ${best.cv.corretos}" (${pct(best.cv.acerto)}). A linha de comando equivalente é:`]),
  ...code([`java -cp weka.jar weka.classifiers.functions.MultilayerPerceptron -t camara_votacoes_2025.arff -H ${best.H} -L ${best.L} -M 0.2 -N ${best.N} -x 10 -s 1`]),
  p(''),
  p('Os dados, o código que gera o .arff e os resultados de todos os experimentos estão no repositório do projeto no GitHub.'),
];
const doc = new Document({
  styles: { default: { document: { run: { font: F, size: 22 } },
    heading1: { run: { font: F, size: 30, bold: true, color: '1F3A5F' }, paragraph: { spacing: { before: 360, after: 140 }, keepNext: true } },
    heading2: { run: { font: F, size: 24, bold: true, color: '1F3A5F' }, paragraph: { spacing: { before: 240, after: 100 }, keepNext: true } } } },
  numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 500, hanging: 260 } } } }] }] },
  sections: [{ properties: { page: { margin: { top: 1300, bottom: 1300, left: 1440, right: 1440 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: ['Redes Neurais no WEKA · página ', PageNumber.CURRENT], font: F, size: 16, color: '777777' })] })] }) },
    children: body }] });
Packer.toBuffer(doc).then(buf => { fs.writeFileSync('entrega/Relatorio_Redes_Neurais_WEKA.docx', buf); console.log('docx ok', buf.length); });
