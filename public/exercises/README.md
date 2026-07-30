# Mídias de exercícios

## Fotos de execução

As fotos desta pasta vêm do projeto público [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), disponibilizado sob a licença [Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE). Cada movimento possui duas imagens: posição inicial (`Nome.jpg`) e posição final (`Nome_2.jpg`).

Exceções originais do GymTrack, geradas especificamente para representar a
variação prescrita com segurança:

- `Seated_Hammer_Curl.jpg` e `_2.jpg`;
- `Stiff_Leg_Deadlift_Low_Deficit.jpg` e `_2.jpg`;
- `Reverse_Grip_Bent-Over_Rows.jpg` e `_2.jpg`.

As imagens `Stomach_Vacuum` e `Reverse_Crunch` continuam provenientes do Free
Exercise DB sob Unlicense.

O comando `npm run sync:exercise-images` baixa novamente os pares usados pelo catálogo do GymTrack.

## Vídeos reais

Os vídeos de `videos/` foram publicados pelo projeto aberto [wger](https://wger.de/). O autor indicado pela API é Goulart. Cada arquivo conserva no nome o ID do exercício no wger.

- CC0: IDs 194, 371 e 570.
- CC BY-SA 4.0: IDs 222, 294, 507 e 803.
- CC BY-SA 3.0: demais vídeos desta pasta.

Fontes e licenças: [API do wger](https://wger.de/api/v2/), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) e [CC0](https://creativecommons.org/publicdomain/zero/1.0/).

Os arquivos foram reduzidos para oito segundos e resolução celular sem alterar o conteúdo da execução. O comando `npm run sync:exercise-videos` refaz a conversão no macOS.
