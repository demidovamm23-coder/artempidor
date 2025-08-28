const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

// Загружаем библиотеку стихов
const library = JSON.parse(fs.readFileSync('library.json'));

// Эндпоинт для навыка Алисы
app.post('/', (req, res) => {
  const userLine = req.body?.request?.original_utterance || "";

  // Ищем стих, который начинается с указанной строки
  const poem = library.find(p =>
    p.lines.some(line => line.toLowerCase() === userLine.toLowerCase())
  );

  let responseText = "";

  if (poem) {
    if (poem.free || req.body?.session?.user?.premium) {
      // Находим следующую строчку
      const index = poem.lines.findIndex(line => line.toLowerCase() === userLine.toLowerCase());
      responseText = poem.lines[index + 1] || "Стих закончился!";
    } else {
      responseText = "Этот стих доступен только в платной версии.";
    }
  } else {
    responseText = "Не знаю такого стиха, попробуй другой!";
  }

  res.json({
    response: { text: responseText },
    version: req.body.version
  });
});

// Запуск сервера
const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port}`));
