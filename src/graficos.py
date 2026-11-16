# -*- coding: utf-8 -*-
"""Gera as figuras do relatorio a partir de dados/resultados.json."""
import json, sys
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
R = json.load(open('dados/resultados.json')); META = json.load(open('dados/metadados.json'))
AZUL, LARANJA, TXT, SEC, GRID, SURF = '#2a78d6', '#eb6834', '#0b0b0b', '#52514e', '#e4e3df', '#fcfcfb'
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.edgecolor': GRID, 'axes.labelcolor': SEC,
    'xtick.color': SEC, 'ytick.color': SEC, 'text.color': TXT, 'figure.facecolor': SURF, 'axes.facecolor': SURF, 'savefig.facecolor': SURF})
def linhas(grupo, chave, rotulo_x, titulo, arq, fmt=str):
    rs = R[grupo]; xs = [fmt(r[chave]) for r in rs]; pos = range(len(rs))
    fig, ax = plt.subplots(figsize=(7.2, 3.6))
    for campo, cor, nome in (('treino', LARANJA, 'Conjunto de treino'), ('cv', AZUL, 'Validação cruzada (10 partes)')):
        ys = [r[campo]['acerto'] for r in rs]
        ax.plot(pos, ys, color=cor, lw=2, marker='o', ms=6, mec=SURF, mew=1.5, label=nome)
        for i in (0, len(ys) - 1): ax.annotate('%.1f%%' % ys[i], (i, ys[i]), textcoords='offset points', xytext=(0, 8 if campo == 'treino' else -15), ha='center', fontsize=9, color=TXT)
    ax.set_xticks(list(pos)); ax.set_xticklabels(xs); ax.set_ylim(40, 100); ax.set_xlabel(rotulo_x); ax.set_ylabel('Acerto (%)')
    ax.grid(axis='y', color=GRID, lw=0.8); ax.set_axisbelow(True)
    for s in ('top', 'right', 'left'): ax.spines[s].set_visible(False)
    ax.tick_params(length=0); ax.set_title(titulo, loc='left', fontsize=11, fontweight='bold')
    ax.legend(frameon=False, loc='lower left', ncol=2, fontsize=9)
    fig.tight_layout(); fig.savefig(arq, dpi=200); plt.close(fig)
linhas('arquitetura', 'H', 'Camadas ocultas (hiddenLayers)', 'Acerto por arquitetura (L = 0,3; N = 500)', 'figuras/fig1_arquitetura.png')
linhas('taxa', 'L', 'Taxa de aprendizado (learningRate)', 'Acerto por taxa de aprendizado (H = 13; N = 500)', 'figuras/fig2_taxa.png', lambda v: str(v).replace('.', ','))
linhas('tempo', 'N', 'Épocas de treinamento (trainingTime)', 'Acerto por tempo de treinamento (H = 13; L = 0,3)', 'figuras/fig3_tempo.png')
best = max(R['combinada'], key=lambda r: r['cv']['acerto']); M = best['matriz']; cls = [c['classe'] for c in META['classes']]
cmap = LinearSegmentedColormap.from_list('azul', [SURF, '#cde2fb', '#5598e7', '#104281'])
fig, ax = plt.subplots(figsize=(7.2, 4.8)); ax.imshow(M, cmap=cmap, vmin=0, vmax=max(max(r) for r in M))
for i, row in enumerate(M):
    for j, v in enumerate(row): ax.text(j, i, str(v), ha='center', va='center', fontsize=10, color='white' if v > 40 else TXT, fontweight='bold' if i == j else 'normal')
ax.set_xticks(range(7)); ax.set_yticks(range(7)); ax.set_xticklabels(cls, rotation=30, ha='right'); ax.set_yticklabels(cls)
ax.set_xlabel('Partido previsto pela rede'); ax.set_ylabel('Partido real'); ax.tick_params(length=0)
for s in ax.spines.values(): s.set_visible(False)
ax.set_xticks([x - .5 for x in range(8)], minor=True); ax.set_yticks([y - .5 for y in range(8)], minor=True); ax.grid(which='minor', color=SURF, lw=2); ax.tick_params(which='minor', length=0)
fig.suptitle('Matriz de confusão da melhor rede (validação cruzada)', x=0.02, ha='left', fontsize=11, fontweight='bold')
fig.tight_layout(); fig.savefig('figuras/fig4_matriz_confusao.png', dpi=200); plt.close(fig)
print('ok', best['H'], best['L'], best['N'])
