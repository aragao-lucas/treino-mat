document.addEventListener("DOMContentLoaded", function() {
    const totalQuestions = 10;
    let currentQuestion = 0;
    let score = 0;
    let currentAnswer = null;

    const questionEl = document.getElementById("question");
    const scoreEl = document.getElementById("score");
    const progressEl = document.getElementById("progress");
    const feedbackEl = document.getElementById("feedback");
    const answerInput = document.getElementById("answer");
    const submitButton = document.getElementById("submit");

    const operation = document.body.dataset.operation || "add";
    const level = parseInt(document.body.dataset.level, 10) || 1;
    const operationLabel = {
        add: "+",
        sub: "-",
        mul: "×",
        div: "÷",
        premium: "+ / -"
    }[operation] || "+";

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRange() {
        if (level === 1) return { min: 0, max: 9 };
        if (level === 2) return { min: 0, max: 100 };
        return { min: 0, max: 1000 };
    }

    function makeQuestion() {
        const range = getRange();
        let a, b, questionText;

        if (operation === "add") {
            a = randomInt(range.min, range.max);
            b = randomInt(range.min, range.max);
            currentAnswer = a + b;
            questionText = `Quanto é ${a} + ${b}?`;
        } else if (operation === "sub") {
            a = randomInt(range.min, range.max);
            b = randomInt(range.min, range.max);
            if (b > a) [a, b] = [b, a];
            currentAnswer = a - b;
            questionText = `Quanto é ${a} - ${b}?`;
        } else if (operation === "mul") {
            const mulRange = level === 1 ? {min: 0, max: 9} : level === 2 ? {min: 0, max: 12} : {min: 0, max: 20};
            a = randomInt(mulRange.min, mulRange.max);
            b = randomInt(mulRange.min, mulRange.max);
            currentAnswer = a * b;
            questionText = `Quanto é ${a} × ${b}?`;
        } else if (operation === "premium") {
            const range = getRange();
            const c = randomInt(range.min, range.max);
            a = randomInt(range.min, range.max);
            b = randomInt(range.min, range.max);
            currentAnswer = a + b - c;
            questionText = `Quanto é ${a} + ${b} - ${c}?`;
        } else {
            const divRange = level === 1 ? {min: 1, max: 9} : level === 2 ? {min: 1, max: 12} : {min: 1, max: 20};
            const divisor = randomInt(divRange.min, divRange.max);
            const result = randomInt(divRange.min, divRange.max);
            a = divisor * result;
            b = divisor;
            currentAnswer = result;
            questionText = `Quanto é ${a} ÷ ${b}?`;
        }

        questionEl.textContent = questionText;
        progressEl.textContent = `Pergunta ${currentQuestion + 1} de ${totalQuestions}`;
        answerInput.value = "";
        feedbackEl.textContent = "";
        answerInput.focus();
    }

    function updateScore() {
        scoreEl.textContent = `${score} / ${totalQuestions}`;
    }

    function finishQuiz() {
        questionEl.textContent = "Quiz finalizado!";
        progressEl.textContent = `Sua pontuação final é ${score} de ${totalQuestions}`;
        feedbackEl.textContent = "Parabéns por treinar!";
        submitButton.disabled = true;
        answerInput.disabled = true;
    }

    function submitAnswer() {
        const answer = parseFloat(answerInput.value);
        if (Number.isNaN(answer)) {
            feedbackEl.textContent = "Digite um número antes de enviar.";
            return;
        }

        if (answer === currentAnswer) {
            feedbackEl.textContent = "✅ Resposta correta!";
            score += 1;
        } else {
            feedbackEl.textContent = `❌ Errado, a resposta certa é ${currentAnswer}.`;
        }

        currentQuestion += 1;
        updateScore();

        if (currentQuestion >= totalQuestions) {
            finishQuiz();
            return;
        }

        setTimeout(makeQuestion, 800);
    }

    submitButton.addEventListener("click", submitAnswer);
    answerInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            submitAnswer();
        }
    });

    document.getElementById("quizOperation").textContent = operationLabel;
    document.getElementById("quizLevel").textContent = level;
    updateScore();
    makeQuestion();
});
