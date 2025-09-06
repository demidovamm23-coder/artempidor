const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// ===================== СТИХИ =====================
const poems = {
    "example": [
        "Мороз и солнце; день чудесный!",
        "Еще ты дремлешь, друг прелестный —",
        "Пора, красавица, проснись;",
        "Открой сомкнуты негой взоры"
    ]
};

// ===================== ПРИВЕТСТВИЯ =====================
const greetings = [
    `Добро пожаловать, мой милый друг! 
Здесь лира правит безраздельно. 
Творцов, искателей не широк круг. 
Но здесь любовь к искусству неподдельна. 
Прочтём с тобою стихи?`,

    `Приветствую тебя, мой друг сердечный!
Здесь Муза царствует, владычица небес.
Немного нас — но пламень бесконечный
В искусстве оживает каждый раз!`,

    `Заходи, путник светлый, сюда,
Где стихи — словно звёзды во мраке.
Мало нас, но горит без стыда
Жажда истины в каждой бумагe.`,

    `Привет тебе, мой друг уединённый,
Здесь Муза правит — тихий, грозный свет.
И мал наш круг, но сердцем вдохновлённый,
Хранит в себе он искренности след.`
];

// ===================== ПРОЩАНИЯ =====================
const farewells = [
    `Благодарю, мой друг любезный,
Что честь явили мне придти.
Я буду ждать визит ваш чуткий,
Когда душе захочется цветы
Из слов сорвать — и вновь в мечтах блуждать.`,

    `Спасибо, друг, что снизошёл ко мне,
Как путник к свету в сумрачной долине.
Я жду тебя — в печали и во сне,
Чтоб слово вновь дало душе святыню.`,

    `Спасибо, Cher ami, что честью удостоивши ко мне зашли! 
Я буду ждать Вас снова, коль надобно усталую душу понежить силой слова!`
];

// ===================== Вспомогательные функции =====================
function withAudio(text, audioName = "") {
    return audioName ? `${text} <audio src='${audioName}'/>` : text;
}

function normalizeText(text) {
    return text.toLowerCase().replace(/[.,;:!?]/g, "").trim();
}

// ===================== WEBHOOK =====================
app.post('/', (req, res) => {
    const request = req.body;
    const session = request.session;

    if (!session.state) session.state = {};

    let responseText = "";
    let endSession = false;
    const command = normalizeText(request.request.original_utterance || "");

    // ===================== Авторизация =====================
    if (!session.user?.access_token) {
        return res.json({
            version: "1.0",
            response: {
                text: "Чтобы продолжить, войдите через аккаунт",
                end_session: false
            },
            session: session
        });
    }

    // ===================== Случайное приветствие =====================
    if (!session.state.stage) {
        const randomIndex = Math.floor(Math.random() * greetings.length);
        session.state.greetingIndex = randomIndex;
        responseText = withAudio(greetings[randomIndex]);
        session.state.stage = "ask_start_poem";
    } 
    else if (session.state.stage === "ask_start_poem") {
        if (command.includes("да")) {
            session.state.stage = "recite_line";
            session.state.poem = "example";
            session.state.lineIndex = 0;
            responseText = withAudio("Слушаю твою первую строчку");
        } else {
            responseText = withAudio("Хорошо, перейдём к следующему, который ты хорошо знаешь, или на сегодня достаточно поэзии?");
            session.state.stage = "ask_skip_or_stop";
        }
    } 
    else if (session.state.stage === "recite_line") {
        const poemLines = poems[session.state.poem];
        const currentLine = poemLines[session.state.lineIndex];
        if (command === normalizeText(currentLine)) {
            session.state.lineIndex++;
            if (session.state.lineIndex >= poemLines.length) {
                responseText = withAudio("Стихотворение закончено! Хотите повторить и выучить строчки?");
                session.state.stage = "ask_learn";
            } else {
                responseText = withAudio(`Хорошо, следующая строчка:`);
            }
        } else if (command.includes("я дальше не знаю")) {
            responseText = withAudio("Хотите выучить эти строчки?");
            session.state.stage = "teach_lines";
        } else {
            responseText = withAudio(`Здесь чуть-чуть неверно. Правильная версия: ${currentLine}. Продолжим следующей строчкой?`);
        }
    } 
    else if (session.state.stage === "teach_lines") {
        if (command.includes("да")) {
            const poemLines = poems[session.state.poem];
            const start = session.state.lineIndex;
            const end = Math.min(start + 4, poemLines.length);
            const linesToTeach = poemLines.slice(start, end).join(" ");
            responseText = withAudio(`Повторяем следующее четверостишье: ${linesToTeach}. Теперь повторяйте сами по строчкам`);
            session.state.stage = "repeat_lines";
            session.state.teachIndex = 0;
        } else {
            responseText = withAudio("Хорошо, перейдём к следующему или на сегодня достаточно поэзии?");
            session.state.stage = "ask_skip_or_stop";
        }
    }
    else if (session.state.stage === "repeat_lines") {
        session.state.teachIndex++;
        if (session.state.teachIndex >= 4 || session.state.lineIndex + session.state.teachIndex >= poems[session.state.poem].length) {
            session.state.lineIndex += 4;
            responseText = withAudio("Четверостишье повторено, продолжаем стихотворение?");
            session.state.stage = "recite_line";
        } else {
            responseText = withAudio("Теперь следующая строчка повторяем");
        }
    }
    else if (session.state.stage === "ask_skip_or_stop") {
        if (command.includes("всё хватит") || command.includes("стоп")) {
            const randomFarewellIndex = Math.floor(Math.random() * farewells.length);
            responseText = withAudio(farewells[randomFarewellIndex]);
            endSession = true;
        } else {
            responseText = withAudio("Хорошо, продолжаем другой стих или повторяем предыдущий?");
        }
    }
    else if (command.includes("привет")) {
        responseText = withAudio("Привет! Как твои дела?");
    } else if (command.includes("пока")) {
        const randomFarewellIndex = Math.floor(Math.random() * farewells.length);
        responseText = withAudio(farewells[randomFarewellIndex]);
        endSession = true;
    } else {
        responseText = withAudio("Я не понимаю");
    }

    res.json({
        version: "1.0",
        response: {
            text: responseText,
            tts: responseText,
            end_session: endSession
        },
        session: session
    });
});

// ===================== OAuth (Render тестовый вариант) =====================
app.get('/auth', (req, res) => {
    res.redirect(`/token`);
});

app.get('/token', (req, res) => {
    res.json({
        access_token: "demo-token-for-user",
        token_type: "Bearer",
        expires_in: 3600
    });
});

// ===================== START SERVER =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
