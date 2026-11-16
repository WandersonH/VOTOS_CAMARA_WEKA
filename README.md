# Votos da Câmara no WEKA

Uma rede neural MLP consegue identificar o partido de um deputado federal pelos seus votos? Trabalho prático de Redes Neurais (disciplina de Inteligência Artificial), feito com a ferramenta WEKA e dados reais da Câmara dos Deputados.

## Resultado em uma linha

A melhor rede (13 neurônios ocultos, taxa de aprendizado 0,01, 500 épocas) acerta 66,24% dos partidos na validação cruzada de 10 partes (257 de 388 deputados), contra 22,16% de quem sempre chuta o maior partido. Ela reconhece todos os deputados do PT e 84% dos do PL, e confunde entre si os partidos de centro.

## Arquivos de entrega

| Arquivo | O que é |
|---|---|
| `entrega/camara_votacoes_2025.arff` | Base no formato do WEKA: 388 deputados, 20 votos (Sim/Nao) e a classe partido |
| `entrega/Relatorio_Redes_Neurais_WEKA.docx` | Relatório com domínio, dados, arquitetura, experimentos e conclusões |

## Dados

- Fonte: [Dados Abertos da Câmara dos Deputados](https://dadosabertos.camara.leg.br), arquivos `votacoesVotos-2025.csv`, `votacoes-2025.csv` e `votacoesProposicoes-2025.csv`.
- Universo em 2025: 175.067 votos nominais, 550 votações com voto nominal, 551 deputados com voto.
- Amostra: 20 votações disputadas do Plenário, escolhidas manualmente entre 228, e 388 deputados dos 7 maiores partidos (PL, PT, União, PP, Republicanos, PSD, MDB) com Sim ou Não em pelo menos 10 das 20.
- Ausência, abstenção, obstrução e art. 17 viram valor faltante (`?`).

`dados/camara_votacoes_2025_selecao.json` guarda os votos das 20 votações como vieram da Câmara; `dados/camara_votacoes_2025.csv` é a mesma base do `.arff` com nome, UF e código do deputado; `dados/metadados.json` descreve cada votação.

## Experimentos

Todos com `weka.classifiers.functions.MultilayerPerceptron` (WEKA 3.9.7), validação cruzada estratificada de 10 partes e semente 1. Variei três parâmetros:

- arquitetura (`hiddenLayers`): 0, 5, 10, 13, 21, 27, "13,10", "21,14" e "13,10,8";
- taxa de aprendizado (`learningRate`): 0,01 a 0,9;
- tempo de treinamento (`trainingTime`): 10 a 5.000 épocas.

Os números de todas as execuções estão em `dados/resultados.json` e a página `index.html` mostra as tabelas e as figuras.

## Como reproduzir

No WEKA Explorer: abrir o `.arff`, aba Classify, escolher functions > MultilayerPerceptron, preencher `hiddenLayers = 13`, `learningRate = 0.01`, `trainingTime = 500` e rodar com Cross-validation de 10 folds.

Pela linha de comando:

```
java -cp weka.jar weka.classifiers.functions.MultilayerPerceptron \
  -t entrega/camara_votacoes_2025.arff -H 13 -L 0.01 -M 0.2 -N 500 -x 10 -s 1
```

Para refazer tudo (precisa de Java, Python 3, Node com o pacote `docx` e uma pasta com o `weka.jar`):

```
python3 src/gerar_arff.py dados/camara_votacoes_2025_selecao.json entrega/camara_votacoes_2025.arff dados/camara_votacoes_2025.csv dados/metadados.json
python3 src/experimentos.py <pasta do weka.jar> entrega/camara_votacoes_2025.arff dados/resultados.json
python3 src/graficos.py
node src/relatorio.js
```

## Limitações

São poucos exemplos para 7 classes (a margem de erro de um acerto de 65% é de cerca de 2,4 pontos), as 20 votações foram escolhidas manualmente, e o partido é uma classe imperfeita, porque há deputados que votam diferente da própria bancada. A classificação tem finalidade didática.
