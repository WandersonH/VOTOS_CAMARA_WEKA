# -*- coding: utf-8 -*-
"""Roda os experimentos de MLP no Weka (linha de comando) e grava resultados.json.
Uso: python3 experimentos.py <pasta com weka.jar> <arquivo.arff> <saida.json>
Cada experimento = validacao cruzada de 10 partes (semente 1) + avaliacao no proprio conjunto de treino."""
import subprocess, re, json, sys, time
from concurrent.futures import ThreadPoolExecutor
LIB, ARFF, OUT = sys.argv[1:4]
def weka(cls, opts):
    cmd = ['java', '-cp', LIB + '/*', cls, '-t', ARFF, '-x', '10', '-s', '1'] + opts
    t = time.time(); o = subprocess.run(cmd, capture_output=True, text=True).stdout; dt = time.time() - t
    def bloco(tag):
        s = o.split(tag)[1]
        return dict(acerto=float(re.search(r'Correctly Classified Instances\s+\d+\s+([\d.]+)', s).group(1)),
                    corretos=int(re.search(r'Correctly Classified Instances\s+(\d+)', s).group(1)),
                    kappa=float(re.search(r'Kappa statistic\s+(-?[\d.]+)', s).group(1)),
                    rmse=float(re.search(r'Root mean squared error\s+([\d.]+)', s).group(1)))
    r = dict(treino=bloco('=== Error on training data ==='), cv=bloco('=== Stratified cross-validation ==='), segundos=round(dt, 1))
    m = o.split('=== Stratified cross-validation ===')[1]
    r['matriz'] = [[int(x) for x in l.split('|')[0].split()] for l in m.split('=== Confusion Matrix ===')[1].strip().splitlines()[1:] if '|' in l]
    r['por_classe'] = [dict(classe=l.split()[-1], precisao=l.split()[2], recall=l.split()[3], f1=l.split()[4])
                       for l in m.split('=== Detailed Accuracy By Class ===')[1].split('Weighted Avg.')[0].strip().splitlines()[1:] if l.strip()]
    return r
MLP = 'weka.classifiers.functions.MultilayerPerceptron'
def mlp(H, L, N, M=0.2):
    r = weka(MLP, ['-H', str(H), '-L', str(L), '-M', str(M), '-N', str(N)]); r.update(H=str(H), L=L, N=N, M=M); return r
BASE = dict(H='13', L=0.3, N=500)
grupos = {
 'arquitetura': [dict(BASE, H=h) for h in ['0', '5', '10', '13', '21', '27', '13,10', '21,14', '13,10,8']],
 'taxa':        [dict(BASE, L=l) for l in [0.01, 0.05, 0.1, 0.3, 0.5, 0.9]],
 'tempo':       [dict(BASE, N=n) for n in [10, 50, 100, 250, 500, 1000, 2000, 5000]],
 'combinada':   [dict(H='13', L=0.01, N=n) for n in [500, 1000, 2000]] + [dict(H='5', L=0.01, N=n) for n in [500, 2000]],
}
res = {}
with ThreadPoolExecutor(4) as ex:
    fut = {g: [ex.submit(mlp, **c) for c in cs] for g, cs in grupos.items()}
    outros = {n: ex.submit(weka, c, o) for n, c, o in [('ZeroR', 'weka.classifiers.rules.ZeroR', []),
              ('NaiveBayes', 'weka.classifiers.bayes.NaiveBayes', []), ('J48', 'weka.classifiers.trees.J48', [])]}
    for g in fut: res[g] = [f.result() for f in fut[g]]
    res['outros'] = {n: f.result() for n, f in outros.items()}
json.dump(res, open(OUT, 'w'), indent=1)
for g in grupos:
    print(g)
    for r in res[g]: print('  H=%-8s L=%-4s N=%-5s  CV %.2f%% (kappa %.3f, rmse %.3f)  treino %.2f%%  %ss' % (r['H'], r['L'], r['N'], r['cv']['acerto'], r['cv']['kappa'], r['cv']['rmse'], r['treino']['acerto'], r['segundos']))
for n, r in res['outros'].items(): print('  %-10s CV %.2f%%  treino %.2f%%' % (n, r['cv']['acerto'], r['treino']['acerto']))
