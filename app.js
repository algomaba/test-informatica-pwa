let currentQuestion = 0;
let score = 0;
let timerInterval;
let timeLeft = 0;

const quizDiv = document.getElementById("quiz");
const resultsDiv = document.getElementById("results");
const timerDiv = document.getElementById("timer");
const timeSpan = document.getElementById("time");

document.getElementById("startBtn").onclick = startExam;
document.getElementById("finishBtn").onclick = finishExam;

function startExam() {

    document.getElementById("config").classList.add("hidden");
    quizDiv.classList.remove("hidden");
    document.getElementById("finishBtn").classList.remove("hidden");

    renderQuestions();

    let selectedTime = document.getElementById("timerSelect").value;
    timeLeft = parseInt(selectedTime);

    timerDiv.classList.remove("hidden");
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    let min = Math.floor(timeLeft / 60);
    let sec = timeLeft % 60;

    timeSpan.textContent = `${min}:${sec < 10 ? "0"+sec : sec}`;

    if (timeLeft <= 0) {
        finishExam();
    }
    timeLeft--;
}

function renderQuestions() {
    quizDiv.innerHTML = "";

    questions.forEach((q, i) => {
        let div = document.createElement("div");
        div.classList.add("question");
        div.innerHTML = `<h3>${i+1}. ${q.q}</h3>`;

        q.options.forEach((opt, idx) => {
            div.innerHTML += `
                <label>
                    <input type="radio" name="q${i}" value="${idx}">
                    ${opt}
                </label><br>`;
        });

        quizDiv.appendChild(div);
    });
}

function finishExam() {
    clearInterval(timerInterval);
    quizDiv.classList.add("hidden");
    document.getElementById("finishBtn").classList.add("hidden");
    resultsDiv.classList.remove("hidden");

    let answers = document.querySelectorAll("input[type=radio]:checked");

    let output = "";
    score = 0;

    questions.forEach((q, i) => {
        let userAnswer = document.querySelector(`input[name=q${i}]:checked`);
        
        if (!userAnswer) {
            output += `<p class="wrong"><strong>${i+1}.</strong> Sin responder.<br> Correcta: <b>${q.options[q.answer]}</b></p>`;
            return;
        }

        let val = parseInt(userAnswer.value);

        if (val === q.answer) {
            score++;
            output += `<p class="correct"><strong>${i+1}.</strong> Correcto ✔<br>Respuesta: <b>${q.options[q.answer]}</b></p>`;
        } else {
            output += `<p class="wrong"><strong>${i+1}.</strong> Incorrecto ✘<br>
            Tu respuesta: ${q.options[val]}<br>
            Correcta: <b>${q.options[q.answer]}</b></p>`;
        }
    });

    resultsDiv.innerHTML = `
        <h2>Resultados</h2>
        <p>Puntuación: <strong>${score}/${questions.length}</strong></p>
        ${output}
    `;
}
