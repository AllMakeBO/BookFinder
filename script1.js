const robson = document.querySelector('.robson');
const obstacle = document.querySelector('.obstacle');
const startBtn = document.getElementById('startBtn');

let isJumping = false;
let gravity = 0.96;
let position = 0;
let gameStarted = false;
let obstacleTimerId = null;

/* função de pulo */
function jump() {
  if (!gameStarted) return;
  if (isJumping) return;
  isJumping = true;

  let upInterval = setInterval(() => {
    if (position >= 100) {
      clearInterval(upInterval);

      let downInterval = setInterval(() => {
        if (position <= 0) {
          clearInterval(downInterval);
          isJumping = false;
        }
        position -= 7;
        position = position * gravity;
        robson.style.bottom = position + 'px';
      }, 20);
    } else {
      position += 7;
      robson.style.bottom = position + 'px';
    }
  }, 20);
}

/* liga o pulo a teclado e clique (apenas depois do start ele vai responder) */
document.addEventListener('keydown', jump);
document.addEventListener('click', (e) => {
  // evitar que o clique no botão reinicie pulo antes do start
  if (e.target === startBtn) return;
  jump();
});

/* obstáculo: usamos left para controlar (CSS já definiu left:120% como ponto inicial) */
function moveObstacle() {
  let obstaclePosition = parseFloat(getComputedStyle(obstacle).left) || window.innerWidth;
  clearInterval(obstacleTimerId);

  obstacleTimerId = setInterval(() => {
    if (!gameStarted) return;

    // colisão simples
    if (obstaclePosition < -60) {
      obstaclePosition = window.innerWidth + 200;
    } else if (obstaclePosition > 40 && obstaclePosition < 120 && position < 60) {
      // Game over
      // pausa animações e para o timer
      document.querySelectorAll('.background').forEach(bg => bg.style.animationPlayState = 'paused');
      clearInterval(obstacleTimerId);
      alert('💥 Game Over!');
      location.reload();
      return;
    }

    obstaclePosition -= 10;
    obstacle.style.left = obstaclePosition + 'px';
  }, 20);
}

/* CENÁRIOS: seleção aleatória e ativação */
const cenarios = document.querySelectorAll('.cenario');

function trocarCenarioAleatorio() {
  if (!cenarios || cenarios.length === 0) return;
  // esconde todos
  cenarios.forEach(c => c.classList.remove('active'));
  // escolhe um diferente do atual (se possível)
  const indices = [...Array(cenarios.length).keys()];
  // random pick
  const indice = Math.floor(Math.random() * cenarios.length);
  cenarios[indice].classList.add('active');
}

/* inicia o jogo ao clicar no botão */
startBtn.addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true;
    startBtn.style.display = 'none';
    // ativa um cenário aleatório imediatamente
    trocarCenarioAleatorio();
    // libera animações das backgrounds
    document.querySelectorAll('.background').forEach(bg => {
      bg.style.animationPlayState = 'running';
    });
    // remove classe paused do container (se usar)
    document.querySelector('.game').classList.remove('paused');
    // começa obstáculo
    moveObstacle();
  }
});

/* troca de cenário a cada 20s (só quando o jogo estiver rodando) */
setInterval(() => {
  if (gameStarted) trocarCenarioAleatorio();
}, 20000);
