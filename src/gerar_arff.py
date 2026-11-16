# -*- coding: utf-8 -*-
"""Gera o arquivo ARFF a partir da selecao de votacoes nominais da Camara dos Deputados (2025)."""
import json, collections, csv, sys
SRC, OUT_ARFF, OUT_CSV, OUT_META = sys.argv[1:5]
# nome do atributo para cada votacao selecionada (mesma ordem do arquivo de origem)
NOMES = ["pec_prerrogativas_1turno", "pl_antifaccao_substitutivo", "pdl_susta_decreto_12466", "plp_numero_de_deputados",
 "urgencia_pl_anistia", "mpv1303_tributacao_aplicacoes_req", "pl_streaming_subemenda", "plp_restos_a_pagar",
 "sap1_sustacao_acao_penal", "sap2_sustacao_acao_penal", "rec_pl702_processo_penal", "urgencia_pl_invasores_propriedade",
 "plp163_limite_despesas_educacao_saude", "pl1924_desenvolvimento_infantil_emenda2", "pl6366_dia_defensores_dh_destaque",
 "prc86_glauber_braga_emenda1", "rep2_carla_zambelli_parecer", "urgencia_pl_agroecologia",
 "pdl3_susta_resolucao_conanda_req", "pl_dia_acao_climatica"]
MIN_VOTOS = 10          # deputado precisa ter Sim/Nao em pelo menos 10 das 20 votacoes
N_PARTIDOS = 7          # classe = os 7 maiores partidos
d = json.load(open(SRC, encoding='utf-8'))
assert len(d['votacoes']) == len(NOMES) == 20
cod = lambda v: 'Sim' if v == 'Sim' else 'Nao' if v == 'Não' else '?'
deps = []
for x in d['deputados']:
    v = [cod(a) for a in x['votos']]
    if sum(a != '?' for a in v) >= MIN_VOTOS: deps.append((x, v))
cont = collections.Counter(x['partido'] for x, _ in deps)
partidos = [p for p, _ in cont.most_common(N_PARTIDOS)]
sel = sorted([(x, v) for x, v in deps if x['partido'] in partidos], key=lambda t: (partidos.index(t[0]['partido']), t[0]['nome']))
classe = {p: p.replace('Ã', 'A') for p in partidos}        # UNIÃO -> UNIAO (ARFF sem acento)
with open(OUT_ARFF, 'w', encoding='utf-8', newline='\n') as f:
    f.write("% Votacoes nominais do Plenario da Camara dos Deputados - 2025\n")
    f.write("% Fonte: Dados Abertos da Camara dos Deputados (https://dadosabertos.camara.leg.br)\n")
    f.write("% Cada exemplo e um deputado; cada atributo e o voto dele em uma votacao nominal.\n")
    f.write("% Sim / Nao; '?' = ausencia, abstencao, obstrucao ou art. 17.\n")
    f.write("% Classe: partido do deputado (os 7 maiores partidos da amostra).\n%\n")
    for n, vt in zip(NOMES, d['votacoes']):
        f.write("%% %s = votacao %s (%s), %s\n" % (n, vt['id'], vt['data'], vt['proposicao'] or 'sem proposicao principal'))
    f.write("\n@RELATION camara_votacoes_2025\n\n")
    for n in NOMES: f.write("@ATTRIBUTE %s {Sim,Nao}\n" % n)
    f.write("@ATTRIBUTE partido {%s}\n\n@DATA\n" % ','.join(classe[p] for p in partidos))
    for x, v in sel: f.write(','.join(v) + ',' + classe[x['partido']] + '\n')
with open(OUT_CSV, 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f); w.writerow(['deputado_id', 'nome', 'uf', 'partido'] + NOMES)
    for x, v in sel: w.writerow([x['id'], x['nome'], x['uf'], x['partido']] + v)
meta = dict(universo=d['universo'], fonte=d['fonte'], baixado_em=d['baixado_em'],
    deputados_nas_20_votacoes=len(d['deputados']), deputados_com_min_votos=len(deps), min_votos=MIN_VOTOS,
    instancias=len(sel), classes=[dict(partido=p, classe=classe[p], n=cont[p]) for p in partidos],
    partidos_fora=[dict(partido=p, n=n) for p, n in cont.most_common()[N_PARTIDOS:]],
    faltantes=sum(a == '?' for _, v in sel for a in v), celulas=len(sel) * 20,
    votacoes=[dict(atributo=n, **vt, sim_amostra=sum(v[i] == 'Sim' for _, v in sel), nao_amostra=sum(v[i] == 'Nao' for _, v in sel)) for i, (n, vt) in enumerate(zip(NOMES, d['votacoes']))])
json.dump(meta, open(OUT_META, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(sel), 'instancias;', [(c['classe'], c['n']) for c in meta['classes']], 'faltantes', meta['faltantes'], 'de', meta['celulas'])
