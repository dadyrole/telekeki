# telekeki

Статический сайт с ответами на вопросы к зачёту по дисциплине «Телекоммуникационные системы».
Каждый вопрос — раскрывающийся блок (клик по заголовку показывает/скрывает ответ). Есть поиск и кнопки «Раскрыть/Свернуть все».

## Локально

Открой `index.html` двойным кликом — всё работает без сервера.

## Обновить вопросы

1. Отредактируй `ТКС_Ответы_на_зачёт.md`.
2. Перегенерируй `index.html`:

   ```
   node build.js
   ```

## Опубликовать на GitHub Pages

1. Создай репозиторий на GitHub (например, `telekeki`) — **публичный**.
2. В этой папке выполни:

   ```
   git init
   git add .
   git commit -m "initial"
   git branch -M main
   git remote add origin https://github.com/<твой-логин>/telekeki.git
   git push -u origin main
   ```

3. На GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: main / (root) → Save**.
4. Через 30–60 секунд сайт доступен по адресу `https://<твой-логин>.github.io/telekeki/`.

## Файлы

- `index.html` — готовая страница (сгенерирована из `.md`).
- `style.css` — оформление.
- `script.js` — поиск, подсветка, «раскрыть/свернуть все».
- `build.js` — генератор HTML из `.md`.
- `ТКС_Ответы_на_зачёт.md` — исходник вопросов и ответов.
