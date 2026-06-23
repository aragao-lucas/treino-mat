document.addEventListener("DOMContentLoaded", function() {
    // require authentication to access quizzes
    try{
        if(typeof window.isAuthenticated === 'function' && !window.isAuthenticated()){
            const next = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = 'login.html?next=' + next;
            return;
        }
    }catch(e){ /* ignore if auth not available */ }
    const totalQuestions = 10;
    let currentQuestion = 0;
    let score = 0;
    let currentAnswer = null;
    let lastWasCorrect = null;

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
        premium: "+ e -",
        premium_sub_mul: "- e ×",
        premium_mul_div: "× e ÷"
    }[operation] || "+";

    // prefer per-account high score when available (falls back to global)
    const highScoreKeyBase = `highScore_${operation}_${level}`;
    let highScoreKey = highScoreKeyBase;
    try{
        if(typeof window.getCurrentUser === 'function'){
            const cur = window.getCurrentUser();
            if(cur && cur.id) highScoreKey = `${highScoreKeyBase}_${cur.id}`;
        }
    }catch(e){ /* ignore */ }
    let highScore = parseInt(localStorage.getItem(highScoreKey), 10);
    if (Number.isNaN(highScore)) highScore = 0;
    let highScoreEl = null;

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getRange() {
        if (level === 1) return { min: 0, max: 9 };
        if (level === 2) return { min: 10, max: 99 };
        return { min: 100, max: 999 };
    }

    function getPremiumMulRange() {
        if (level === 1) return { min: 0, max: 9 };
        if (level === 2) return { min: 10, max: 20 };
        return { min: 10, max: 50 };
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
            a = randomInt(range.min, range.max);
            b = randomInt(range.min, range.max);
            currentAnswer = a * b;
            questionText = `Quanto é ${a} × ${b}?`;
        } else if (operation === "premium") {
            const range = getRange();
            const c = randomInt(range.min, range.max);
            a = randomInt(range.min, range.max);
            b = randomInt(range.min, range.max);
            currentAnswer = a + b - c;
            questionText = `Quanto é ${a} + ${b} - ${c}?`;
        } else if (operation === "premium_sub_mul") {
            const mulRange = getPremiumMulRange();
            a = randomInt(mulRange.min, mulRange.max);
            b = randomInt(mulRange.min, mulRange.max);
            const product = a * b;
            const cMin = product === 0 ? 0 : 1;
            const c = randomInt(cMin, product);
            currentAnswer = product - c;
            questionText = `Quanto é ${a} × ${b} - ${c}?`;
        } else if (operation === "premium_mul_div") {
            const mulRange = getPremiumMulRange();
            a = randomInt(mulRange.min, mulRange.max);
            b = randomInt(mulRange.min, mulRange.max);
            const product = a * b;
            const divisors = [];
            for (let i = 1; i <= product; i++) {
                if (product % i === 0) divisors.push(i);
            }
            const divisor = divisors[randomInt(0, divisors.length - 1)];
            currentAnswer = product / divisor;
            questionText = `Quanto é ${a} × ${b} ÷ ${divisor}?`;
        } else {
            const divisorMin = Math.max(1, range.min);
            const divisor = randomInt(divisorMin, range.max);
            const maxResult = Math.max(1, Math.floor(range.max / divisor));
            const minResult = Math.max(1, Math.ceil(range.min / divisor));
            const result = randomInt(minResult, maxResult);
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

    function ensureHighScoreDisplay() {
        const scoreWrapper = document.querySelector(".score-wrapper");
        if (!scoreWrapper) return;

        highScoreEl = document.getElementById("highScore");
        if (!highScoreEl) {
            const highScoreDiv = document.createElement("div");
            highScoreDiv.className = "quiz-score";
            highScoreDiv.innerHTML = `Melhor pontuação: <strong id="highScore">${highScore} / ${totalQuestions}</strong>`;
            scoreWrapper.appendChild(highScoreDiv);
            highScoreEl = document.getElementById("highScore");
        }

        if (highScoreEl) {
            highScoreEl.textContent = `${highScore} / ${totalQuestions}`;
        }
    }

    function createControlButtons() {
        const quizCard = document.querySelector(".quiz-card");
        if (!quizCard) return;

        const buttonContainer = document.createElement("div");
        buttonContainer.className = "quiz-buttons";

        const retryButton = document.createElement("button");
        retryButton.type = "button";
        retryButton.id = "retryButton";
        retryButton.textContent = "Tentar novamente";
        retryButton.addEventListener("click", function() {
            window.location.reload();
        });

        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.id = "backButton";
        backButton.textContent = "Voltar ao menu";
        backButton.addEventListener("click", function() {
            window.location.href = "index.html";
        });

        buttonContainer.appendChild(retryButton);
        // reset score button (resets account score if available)
        const resetScoreButton = document.createElement("button");
        resetScoreButton.type = "button";
        resetScoreButton.id = "resetScoreBtn";
        resetScoreButton.textContent = "Redefinir score";
        resetScoreButton.addEventListener("click", function() {
            if (typeof window.resetScore === 'function') {
                const out = window.resetScore();
                if (out && out.ok) {
                    feedbackEl.textContent = 'Score redefinido.';
                    // update local view of best score
                    highScore = 0;
                    if (highScoreEl) highScoreEl.textContent = `${highScore} / ${totalQuestions}`;
                } else {
                    feedbackEl.textContent = (out && out.message) ? out.message : 'Não foi possível redefinir score.';
                }
            } else {
                feedbackEl.textContent = 'Funcionalidade não disponível.';
            }
        });
        buttonContainer.appendChild(resetScoreButton);
        buttonContainer.appendChild(backButton);
        quizCard.appendChild(buttonContainer);
    }

    function updateScore() {
        scoreEl.textContent = `${score} / ${totalQuestions}`;
        ensureHighScoreDisplay();
        if (highScoreEl) {
            highScoreEl.textContent = `${highScore} / ${totalQuestions}`;
        }
    }

    function finishQuiz() {
        questionEl.textContent = "Quiz finalizado!";
        progressEl.textContent = `Sua pontuação final é ${score} de ${totalQuestions}`;

        const finalAnswerMessage = lastWasCorrect
            ? "✅ Resposta correta!"
            : `❌ Errado, a resposta certa é ${currentAnswer}.`;

        if (score > highScore) {
            highScore = score;
            try{ localStorage.setItem(highScoreKey, String(highScore)); }catch(e){ /* ignore */ }
            if (highScoreEl) {
                highScoreEl.textContent = `${highScore} / ${totalQuestions}`;
            }
            feedbackEl.textContent = `🎉 Novo recorde! Sua pontuação final é ${score} de ${totalQuestions}. ${finalAnswerMessage}`;
        } else {
            feedbackEl.textContent = finalAnswerMessage;
        }

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
            lastWasCorrect = true;
            if (typeof window.addScore === 'function') {
                try { window.addScore(1); } catch(e) { /* ignore */ }
            }
        } else {
            feedbackEl.textContent = `❌ Errado, a resposta certa é ${currentAnswer}.`;
            lastWasCorrect = false;
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
    createControlButtons();
    updateScore();
    makeQuestion();
});
