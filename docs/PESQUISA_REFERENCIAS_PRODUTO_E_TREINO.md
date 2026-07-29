# Pesquisa de Referências — Produto e Treino

Data da verificação: **29/07/2026** (todas as fontes abaixo foram acessadas nesta data via busca/fetch web, salvo indicação). Este documento responde à Fase 5 do prompt de correções da auditoria final: matriz de produtos, dossiê David Laid e evidência científica — **sem fontes inventadas**; o que não foi verificado está listado como pendência explícita no final.

---

## 1. Matriz de produtos (8 apps ativos)

Legenda de colunas: Log = registro de séries · Timer = cronômetro de descanso · Ant. = carga anterior visível · Ret. = retomada de sessão · Prog. = progressão sugerida · Bib. = biblioteca de exercícios/mídia · Off. = offline.

| Produto | Fonte (acesso 29/07/2026) | Log | Timer | Ant. | Ret. | Prog. | Bib. | Off. |
|---|---|---|---|---|---|---|---|---|
| Hevy | [hevyapp.com/features](https://www.hevyapp.com/features/), [rest timer](https://www.hevyapp.com/features/workout-rest-timer/) | ✅ | ✅ auto, ±15 s | ✅ auto-preenche | ✅ | parcial (auto-fill p/ sobrecarga) | ✅ | ✅ |
| Strong | [strong.app](https://www.strong.app/), [plate calculator](https://help.strongapp.io/article/169-plate-calculator) | ✅ minimal | ✅ auto | ✅ | ✅ | ❌ (sem motor) | ✅ | ✅ |
| Fitbod | [fitbodapp.com](https://www.fitbodapp.com/), [algoritmo](https://fitbod.me/blog/fitbod-algorithm/) | ✅ | ✅ | ✅ | ✅ | ✅ gerado por "frescor" muscular (0–100%) | ✅ vídeo/GIF | parcial |
| Alpha Progression | [alphaprogression.com](https://alphaprogression.com/en), [review hotelgyms 2026](https://www.hotelgyms.com/blog/alpha-progression-the-gym-logger-app-from-germany) | ✅ | ✅ | ✅ | ✅ | ✅ peso+reps por série, RIR, **deloads planejados** | ✅ | ✅ |
| Boostcamp | [boostcamp.app/features](https://www.boostcamp.app/features), [review BarBend 2026](https://barbend.com/boostcamp-review/) | ✅ RPE/RIR por série | ✅ | ✅ | ✅ | ✅ via programas (periodização + deload embutidos) | ✅ | parcial |
| JEFIT | [jefit.com](https://www.jefit.com/) (⚠️ dados de comparativos do próprio blog JEFIT — viés) | ✅ | ✅ | ✅ | ✅ | parcial | ✅ 1.400+ c/ vídeo HD | ✅ download p/ offline |
| StrengthLog | [strengthlog.com](https://www.strengthlog.com/) | ✅ | ✅ | ✅ | ✅ | via programas | ✅ 450+ | ✅ |
| Nike Training Club | [nike.com/ntc-app](https://www.nike.com/ntc-app) | ❌ (aulas guiadas, não log de séries) | n/a | n/a | n/a | ❌ | ✅ vídeo | parcial |

### Pontos fortes/fracos e o que o GymTrack adotou (sem copiar visual)

| Produto | Forte | Fraco | Princípio adotado no GymTrack | O que NÃO foi copiado |
|---|---|---|---|---|
| Hevy | auto-preencher desempenho anterior; timer ±15 s | sem noção de recuperação | `PreviousPerformanceSummary` + sugestão com motivo (“por que subiu”) | rede social |
| Strong | densidade mínima na tela ativa | zero inteligência de progressão | tela de sessão enxuta: anterior + campos + concluir | — |
| Fitbod | recuperação por músculo governa a sessão | caixa-preta; ignora programa fixo | `daily_readiness` ajusta a sessão do dia, mas o programa é fixo e transparente | geração automática de treino |
| Alpha Progression | **deload/periodização** e RIR levados a sério | assinatura cara | motor de deload com 3 gatilhos + confirmação (`lib/progression/deload.ts`) | RIR 0 programado em ondas |
| Boostcamp | programas estruturados com deload embutido | menos flexível p/ rotina própria | comunicação de fase/semana (fase de treinamento no Perfil) | catálogo de programas |
| JEFIT | biblioteca enorme com mídia | UX datada; anúncios | biblioteca local licenciada com imagem por exercício | volume de conteúdo com anúncios |
| StrengthLog | grátis de verdade, offline, foco em básicos | estética simples | offline-first (fila idempotente + SW de shell) | — |
| Nike Training Club | produção de vídeo e acessibilidade | não é tracker de força | vídeo como aspiração futura (placeholder honesto até lá) | modelo de aulas |

**Síntese**: o único princípio de mercado que faltava no GymTrack era gestão de estagnação/deload (Alpha Progression/Boostcamp) — implementado nesta rodada. O restante já operava em nível competitivo para uso pessoal.

---

## 2. Dossiê David Laid

### Fontes

- **Secundária oficial (verificada em 29/07/2026):** Gymshark, [“David Laid's Workout”](https://row.gymshark.com/blog/article/david-laid-workout), publicado em **27/05/2026**. David Laid é atleta patrocinado pela Gymshark — a fonte é oficial, mas promocional.
- **Primárias diretas (canais do próprio atleta — YouTube/Instagram):** citadas pelo artigo da Gymshark; **não re-verificadas individualmente nesta data** (listadas como pendência na seção 4).

### Afirmações confirmadas pela fonte oficial (Gymshark, 27/05/2026)

- Divisão **6 dias, DUP** (Daily Undulating Periodization): legs/push/pull 2× por semana, alternando intensidade e volume ao longo da semana.
- Rotação entre esforços de **1RM, 3RM e 5RM** combinados com séries de hipertrofia de **8–12**; sessões de força pesada (3–5), de hipertrofia (8–12) e de potência/velocidade.
- Filosofia declarada: **progressão de força como a ferramenta mais valiosa do atleta natural** para construir físico; compostos pesados + acessórios estratégicos.
- Nutrição: superávit para tamanho, déficit moderado para definição, mantendo proteína e desempenho.

### Inferências (não confirmadas diretamente)

- Uso formal de RIR registrado série a série: **não há evidência** de que ele anote RIR; um 5RM verdadeiro ≈ RIR 0, então ele claramente treina perto da falha nos básicos, mas “David Laid treina com RIR X” é inferência, não fato.
- Qualquer “rotina oficial completa”: não existe; montagens de redes sociais não representam o treino integral.
- Conteúdo antigo (vlogs de 2016–2019) difere do atual — volume e intensidade de atleta avançado não descrevem o que ele fazia como iniciante.

### Princípios adaptados no GymTrack (não copiados)

| Princípio dele | Adaptação no GymTrack | Por quê |
|---|---|---|
| DUP força/hipertrofia | Dias A–C “força técnica”, D–F “hipertrofia” | mesma lógica, sem 1RM/3RM/5RM |
| Progressão de força como base | Progressão dupla com RIR interno 2–3 | iniciante não deve testar máximas |
| Compostos primeiro | Ordem da rotina v4 | igual |
| Perto da falha nos básicos | RIR como **parâmetro interno**; falha não exposta nem incentivada na UI | decisão de produto (29/07/2026) |
| 6 dias/semana | 6 dias com prontidão diária + deload por gatilho | gestão de fadiga que um avançado faz “de cabeça” |

### Elementos NÃO aplicados (avançados ou não verificáveis)

- Esforços de 1RM/3RM/5RM (risco desproporcional para iniciante).
- Falha frequente em compostos.
- Volume absoluto de atleta avançado patrocinado.
- Qualquer claim estético (“treino do David Laid”) — a rotina é uma **adaptação baseada em princípios públicos de powerbuilding e objetivo estético**; genética, tempo de treino, alimentação e consistência tornam cada resultado individual.

---

## 3. Evidência científica (fontes verificadas em 29/07/2026)

| Tema | Achado | Fonte |
|---|---|---|
| **Falha × não-falha (RIR)** | Sem diferença significativa entre treinar à falha ou próximo dela para força (ES −0,09) e hipertrofia (ES 0,22, IC cruza zero) | [Grgic et al., systematic review/meta-analysis, J Sport Health Sci — PubMed 33497853](https://pubmed.ncbi.nlm.nih.gov/33497853/) |
| **Volume semanal** | Dose-resposta: 10+ séries/músculo/semana > <5 séries para hipertrofia; retornos decrescentes em volumes muito altos | [Schoenfeld, Ogborn & Krieger 2017 (dose-response)](https://www.researchgate.net/publication/305455324_Dose-response_relationship_between_weekly_resistance_training_volume_and_increases_in_muscle_mass_A_systematic_review_and_meta-analysis); meta-regressão recente: [PubMed 41343037](https://pubmed.ncbi.nlm.nih.gov/41343037/) |
| **Frequência** | Grandes grupos ≥2×/semana maximizam crescimento; 3× vs 2× indeterminado | [Schoenfeld et al. 2016, Sports Med 46(11)](https://www.researchgate.net/publication/301578131_Effects_of_Resistance_Training_Frequency_on_Measures_of_Muscle_Hypertrophy_A_Systematic_Review_and_Meta-Analysis) |
| **Descanso entre séries** | Benefício pequeno para >60 s; sem diferença apreciável acima de ~90 s; mais descanso favorável em treinados | [Frontiers 2024, Bayesian meta-analysis](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/full); [Schoenfeld 2016, JSCR (longer rest)](https://journals.lww.com/nsca-jscr/fulltext/2016/07000/longer_interset_rest_periods_enhance_muscle.3.aspx) |
| **Core anti-movimento** | Abdominais funcionam controlando movimento; anti-extensão/anti-rotação (ab wheel, Pallof) com alta ativação de reto/oblíquos e menor carga de flexão vertebral repetida (McGill) | [Squat University — McGill Big 3](https://squatuniversity.com/2018/06/21/the-mcgill-big-3-for-core-stability/) (narrativa baseada em EMG; ver pendência) |

**Como isso aparece no app:** faixas 5–15 com RIR 1–3 (falha ≈ opcional e nunca incentivada — consistente com Grgic 2021), 10–15 séries diretas/músculo/semana com frequência 2× (Schoenfeld 2016/2017), descansos 75–180 s (maiores nos compostos), Abdômen Diário com ênfase anti-extensão/anti-rotação e bloqueio por dor.

---

## 3.1 Classificação do material de powerbuilding (rodada de 29/07/2026)

O prompt mestre desta rodada referenciava um arquivo `Texto colado(1).txt` com o artigo sobre o powerbuilding de David Laid. **Esse arquivo não foi encontrado no sistema** (`~/Downloads`, `~/Desktop`, `~/Documents`) — registrado como bloqueio. A classificação abaixo se baseia no resumo de princípios contido no próprio prompt e na fonte Gymshark já verificada (27/05/2026).

| Item | Classificação | Destino no produto |
|---|---|---|
| Powerbuilding (força + hipertrofia) | Fonte secundária | **Aplicado** — rotina v4 e área educativa |
| DUP / variação de intensidade na semana | Fonte secundária | **Aplicado** — dias A–C força técnica, D–F hipertrofia, classificação visível (incl. "Misto") |
| Sobrecarga progressiva | Evidência científica + fonte secundária | **Aplicado** — progressão dupla com motivo e confirmação |
| Compostos como base | Fonte secundária | **Aplicado** — agachamento (hack), supino, desenvolvimento, remada, puxada, hinge, leg press, unilateral |
| Acessórios com progressão | Inferência de implementação | **Aplicado** — mesma engine de progressão + tendência 4–8 semanas |
| Ênfase em ombros e costas | Fonte secundária | **Aplicado** — 8 séries diretas de deltoide lateral, 15 de costas |
| Pull-ups com progressão | Fonte secundária | **Aplicado** — tipo `assistance`, reduzir assistência = progresso |
| Elevações laterais | Fonte secundária | **Aplicado** — faixas 12–20, cue de não balançar |
| Roscas | Fonte secundária | **Aplicado** — 4 variações com progressão |
| Tríceps no cabo | Fonte secundária | **Aplicado** — 3 variações, faixas moderadas/altas |
| Cadeia posterior (hiperextensão) | Fonte secundária | **Adaptado** — cadastrada como alternativa **opcional**, não como série extra, porque a rotina já acumula fadiga lombar (terra romeno, búlgaro, hip thrust, remadas) |
| Estabilidade (bird-dog) | Fonte secundária | **Adaptado** — já existia no Abdômen Diário como `estabilidade`, **não** conta como série de hipertrofia abdominal |
| Dips | Fonte secundária | **Adaptado** — alternativa opcional com versão assistida, alerta de ombro e sem carga adicional para iniciante |
| Acompanhamento de 4–8 semanas | Inferência de implementação | **Aplicado** — janela móvel como lente de observação, sem obrigar troca de exercício |
| Execução controlada | Fonte secundária | **Aplicado** — instruções, erros comuns e cues por exercício |
| Alimentação coerente com objetivo | Fonte secundária | **Adaptado** — superávit/déficit calculados do perfil do usuário, com confirmação; **não** foi copiado o déficit fixo de 300–500 kcal do material |
| Tentativas de 1RM | Fonte secundária | **Rejeitado por segurança** — iniciante não testa máximas |
| 3RM e 5RM frequentes | Fonte secundária | **Rejeitado por segurança** — um 5RM verdadeiro é ≈ RIR 0 em composto pesado |
| Terra pesado com frequência avançada | Fonte secundária | **Rejeitado por segurança** — mantido 1×/semana em terra romeno/stiff |
| Volume e cargas de atleta avançado | Fonte secundária | **Rejeitado por segurança** |
| Falha frequente | Inferência | **Rejeitado** — decisão do usuário: RIR interno, sem exposição/incentivo de falha na UI |
| Rotina copiada integralmente | — | **Rejeitado** — o produto usa "powerbuilding adaptado com princípios públicos" |
| Promessa de físico idêntico | — | **Rejeitado** — avisos explícitos sobre genética e individualidade |

## 4. Pesquisa pendente (explícita, sem fingir conclusão)

- Verificação direta dos vídeos/posts primários do David Laid (URLs e datas individuais) — hoje a cadeia depende do artigo da Gymshark.
- Estudo primário revisado por pares específico de hipertrofia abdominal (a seção core cita síntese narrativa/EMG, não meta-análise).
- Evidência específica de DUP em iniciantes (a adaptação atual é conservadora por princípio, não por meta-análise dedicada).
- Comparativo hands-on dos 8 apps (a matriz usa páginas oficiais e reviews de terceiros de 2026; não houve instalação e teste de cada app).
- Gymshark Training (app) não foi avaliado — a linha da matriz usa Nike Training Club, conforme alternativa prevista no prompt.
