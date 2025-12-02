// app.js (resumen: tu lógica de examen + integración con SW para actualizaciones)
let currentQuestion = 0;
let score = 0;
let timerInterval;
let timeLeft = 0;

const quizDiv = document.getElementById("quiz");
const resultsDiv = document.getElementById("results");
const timerDiv = document.getElementById("timer");
const timeSpan = document.getElementById("time");

const startBtn = document.getElementById("startBtn");
const finishBtn = document.getElementById("finishBtn");
const timerSelect = document.getElementById("timerSelect");
const configDiv = document.getElementById("config");

startBtn.addEventListener("click", startExam);
finishBtn.addEventListener("click", finishExam);

// === SW update handling ===
let newWorker = null;
let refreshing = false;

// Detecta disponibilidad de nueva SW (en waiting state)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js').then(reg => {
    // escucha updates del SW
    reg.addEventListener('updatefound', () => {
      newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          // nueva versión instalada y en waiting (si hay cliente activo)
          if (navigator.serviceWorker.controller) {
            // notificar al usuario
            showUpdateUI();
          } else {
            // primera instalación: cache listo
            console.log('Service worker instalado por primera vez.');
          }
        }
      });
    });
  }).catch(err => console.warn('Error registrando SW:', err));

  // cuando el SW toma control, refresca la página si es necesario
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    window.location.reload();
  });
}

// Muestra botón de actualización en UI
function showUpdateUI() {
  // si ya existe, no duplicar
  if (document.getElementById('updateBtn')) return;
  const btn = document.createElement('button');
  btn.id = 'updateBtn';
  btn.textContent = 'Nueva versión disponible — Actualizar';
  btn.style = 'background:#ff8c00;color:#fff;border:none;padding:8px 12px;border-radius:6px;margin-left:10px;cursor:pointer;';
  btn.onclick = () => {
    // enviar mensaje al sw para que haga skipWaiting y active nueva versión
    if (navigator.serviceWorker.waiting) {
      navigator.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };
  // Añadir al config o al header de la app
  const appHeader = document.querySelector('#app h1') || document.body;
  appHeader.parentNode.insertBefore(btn, appHeader.nextSibling);
}

// ----------------------
// Resto de tu lógica del examen
// ----------------------
function startExam() {
  document.getElementById("config").classList.add("hidden");
  quizDiv.classList.remove("hidden");
  document.getElementById("finishBtn").classList.remove("hidden");

  renderQuestions();

  let selectedTime = document.getElementById("timerSelect").value;
  timeLeft = parseInt(selectedTime);

  timerDiv.classList.remove("hidden");
  updateTimer(); // mostrar inmediatamente
  timerInterval = setInterval(() => {
    updateTimer();
    timeLeft--;
    if (timeLeft < 0) {
      finishExam();
    }
  }, 1000);
}

function updateTimer() {
  let min = Math.floor(timeLeft / 60);
  let sec = timeLeft % 60;
  if (sec < 0) sec = 0;
  timeSpan.textContent = `${min}:${sec < 10 ? "0" + sec : sec}`;
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
