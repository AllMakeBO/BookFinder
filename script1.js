const robson = document.querySelector('.robson');
const obstacle = document.querySelector('.obstacle');
const startBtn = document.getElementById('startBtn');

let isJumping = false;
let gravity = 0.96;
let position = 0;
let gameStarted = false;
let obstacleTimerId = null;
let lastTime = 0;
let obstacleSpeed = 200; // Velocidade base do obstáculo em pixels por segundo (pode ser ajustada)

// Função de pulo (não precisa de delta time, pois a altura do pulo é fixa)
function jump() {
  if (!gameStarted) return;
  if (isJumping) return;
  isJumping = true;

  const div = document.querySelector(".game");
  const altura = div.clientHeight;
  const jumpHeight = altura * 0.25;
  const jumpStep = 7; // Passo fixo de subida/descida
  const intervalTime = 30; // Intervalo fixo de 20ms

  let upInterval = setInterval(() => {
    if (position >= jumpHeight) {
      clearInterval(upInterval);

      let downInterval = setInterval(() => {
        if (position <= 0) {
          clearInterval(downInterval);
          isJumping = false;
        }
        // A gravidade original (position = position * gravity) foi removida,
        // pois estava causando um efeito de "flutuação" no final do pulo.
        // A descida agora usa um passo fixo.
        position -= jumpStep;
        if (position < 0) position = 0; // Garante que não desça abaixo de 0
        robson.style.bottom = `calc(17% + ${position}px)`;
      }, intervalTime);
    } else {
      position += jumpStep;
      robson.style.bottom = `calc(17% + ${position}px)`;
    }
  }, intervalTime);
}

// Liga o pulo a teclado e clique (apenas depois do start ele vai responder)
document.addEventListener('keydown', jump);
document.addEventListener('click', (e) => {
  if (e.target === startBtn) return;
  jump();
});

// Loop principal de atualização do jogo (usando requestAnimationFrame para consistência)
function gameLoop(currentTime) {
  if (!gameStarted) {
    lastTime = currentTime;
    requestAnimationFrame(gameLoop);
    return;
  }

  // Calcula o delta time em segundos
  const deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  // Atualiza a posição do obstáculo
  updateObstacle(deltaTime);

  // Verifica colisão
  checkCollision();

  // Agenda o próximo frame
  requestAnimationFrame(gameLoop);
}

// Função para mover o obstáculo
function updateObstacle(deltaTime) {
  let obstaclePosition = parseFloat(getComputedStyle(obstacle).left);
  if (isNaN(obstaclePosition)) {
    obstaclePosition = document.querySelector('.game').clientWidth; // Posição inicial
  }

  // Calcula o deslocamento com base no delta time e na velocidade em pixels/segundo
  const displacement = obstacleSpeed * deltaTime;

  // Reinicia o obstáculo quando sai da tela
  if (obstaclePosition < -100) {
    obstaclePosition = document.querySelector('.game').clientWidth + 200;
  }

  obstaclePosition -= displacement;
  obstacle.style.left = obstaclePosition + 'px';
}

// Função para verificar colisão
function checkCollision() {
  const robsonRect = robson.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();

  // cria hitboxes "encolhidas" para reduzir falsos positivos
  const shrinkFactor = 0.18; // 18% de encolhimento nas laterais/vertical
  const rPadX = robsonRect.width * shrinkFactor;
  const rPadY = robsonRect.height * shrinkFactor;
  const oPadX = obstacleRect.width * 0.12; // obstáculo um pouco menos encolhido
  const oPadY = obstacleRect.height * 0.12;

  const rLeft = robsonRect.left + rPadX;
  const rRight = robsonRect.right - rPadX;
  const rTop = robsonRect.top + rPadY;
  const rBottom = robsonRect.bottom - rPadY;

  const oLeft = obstacleRect.left + oPadX;
  const oRight = obstacleRect.right - oPadX;
  const oTop = obstacleRect.top + oPadY;
  const oBottom = obstacleRect.bottom - oPadY;

  // Detecta colisão usando as hitboxes reduzidas
  const collided = (rLeft < oRight && rRight > oLeft && rTop < oBottom && rBottom > oTop);

  if (collided) {
    document.querySelectorAll('.background').forEach(bg => bg.style.animationPlayState = 'paused');
    // Não precisa de clearInterval(obstacleTimerId) pois não estamos usando setInterval
    gameStarted = false;
    alert('💥 Game Over!');
    location.reload();
    return;
  }
}

// CENÁRIOS: seleção aleatória e ativação
const cenarios = document.querySelectorAll('.cenario');

function trocarCenarioAleatorio() {
  if (!cenarios || cenarios.length === 0) return;
  cenarios.forEach(c => c.classList.remove('active'));
  const indice = Math.floor(Math.random() * cenarios.length);
  cenarios[indice].classList.add('active');
}

// inicia o jogo ao clicar no botão
startBtn.addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true;
    startBtn.style.display = 'none';
    trocarCenarioAleatorio();
    document.querySelectorAll('.background').forEach(bg => {
      bg.style.animationPlayState = 'running';
    });
    document.querySelector('.game').classList.remove('paused');
    // Inicia o loop do jogo
    requestAnimationFrame(gameLoop);
  }
});

// troca o cenário a cada 20s
setInterval(() => {
  if (gameStarted) trocarCenarioAleatorio();
}, 20000);

// Troca inicial para garantir que um cenário esteja ativo ao começar
trocarCenarioAleatorio();
