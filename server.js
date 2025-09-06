const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

// Подключаем body-parser для JSON и form-data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== СТАРЫЙ WEBHOOK ДЛЯ АЛИСЫ =====
app.post('/', (req, res) => {
  const { request } = req.body;
  let responseText = 'Привет!';

  if (request && request.command) {
    if (request.command.toLowerCase() === 'привет') {
      responseText = 'Привет! Как твои дела?';
    } else if (request.command.toLowerCase() === 'пока') {
      responseText = 'Пока! Хорошего дня!';
    }
  }

  res.json({
    version: '1.0',
    response: {
      text: responseText,
      end_session: false
    }
  });
});

// ===== НОВЫЕ МАРШРУТЫ ДЛЯ OAUTH =====

// Authorization URL
app.get('/auth', (req, res) => {
  res.send(`
    <h1>Авторизация</h1>
    <p>Нажмите кнопку, чтобы авторизоваться.</p>
    <form action="/token" method="POST">
      <input type="hidden" name="code" value="123">
      <button type="submit">Войти</button>
    </form>
  `);
});

// Token URL
app.post('/token', (req, res) => {
  const code = req.body.code || 'default-code';
  res.json({ access_token: 'token-for-' + code });
});

// ===== ЗАПУСК СЕРВЕРА =====
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
