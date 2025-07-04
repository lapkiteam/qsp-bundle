# qsp-bundle

Утилита, собирающая воедино все QSP исходники в папках и в подпапках согласно указанному главному исходнику.

```bash
Usage: qsp-bundle [options] <main_source_path>

Аргументы:
  main_source_path     путь к главному исходнику

Опции:
  -V, --version        версия утилиты
  -o, --output <path>  путь к конечному файлу
  -w, --watch          watch режим
  -h, --help           справка
```

## Пример

Дана следующая структура файлов и папок игры:

```bash
src
├── assets
│   └── forest.png
├── characters
│   └── hero.qsps
├── forest
├── items
│   ├── potion.qsps
│   ├── shield.qsps
│   └── sword.qsps
├── lib.qsps
├── locations
│   ├── city.qsps
│   └── forest.qsps
├── main.ico
├── main.qsps
└── version.qsps
```

В каждом из исходников (файлов с расширением `.qsps`) содержится что-то такое:

* `main.qsps`:

  ```qsp
  # main

  -
  ```

* `items/potion.qsps`:

  ```qsp
  # potion

  -
  ```

* и т.д.

`main.qsps` — главный исходник, с которого начинается отсчет. Его содержимое будет располагаться в начале конечного файла.

Запуск:

```bash
qsp-bundle -o game.qsps src/main.qsps
```

Создаст файл `game.qsps` и запишет туда следующее содержимое:

```qsps
# main

-

# lib

-

# version

-

# hero

-

# potion

-

# shield

-

# sword

-

# city

-

# forest

-
```
