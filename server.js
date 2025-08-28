const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Простой тестовый эндпоинт
app.post('/', (req, res) => {
  res.json({
    response: {
      text: "Привет! Алиса готова играть со стихами."
    },
    version: req.body.version
  });
});

// Запуск сервера на порту Render
const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => console.log(`Server running on port ${port}`));
