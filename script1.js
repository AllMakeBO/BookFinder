const robson = document.querySelector('.robson');
const obstacle = document.querySelector('.obstacle');
const collectible = document.querySelector('.collectible'); // Novo coletável
const startBtn = document.getElementById('startBtn');
const gameDiv = document.querySelector('.game');
const scoreDisplay = document.getElementById('scoreDisplay');

let isJumping = false;
let position = 0;
let gameStarted = false;
let lastTime = 0;
let obstacleSpeed = 450; // Velocidade base em pixels/segundo, agora será ajustada para ser relativa
let collectibleSpeed = obstacleSpeed * 0.8; // Coletável um pouco mais lento que o obstáculo
let score = 0;
let obstacleVisible = false; // Controla se o obstáculo está visível/ativo
let collectibleVisible = false; // Controla se o coletável está visível/ativo

// Função para obter a largura real do contêiner do jogo
function getGameWidth() {
    return gameDiv.clientWidth;
}

// Função de pulo
function jump() {
  if (!gameStarted) return;
  if (isJumping) return; 
  isJumping = true;

  const altura = gameDiv.clientHeight;
  const jumpHeight = altura * 0.25;
  // O passo do pulo agora é proporcional à altura do jogo, garantindo velocidade consistente
  const jumpStep = jumpHeight / 10; // Ex: Se jumpHeight for 200px, o passo é 20px
  const intervalTime = 30;

  let upInterval = setInterval(() => {
    if (position >= jumpHeight) {
      clearInterval(upInterval);

      let downInterval = setInterval(() => {
        if (position <= 0) {
          clearInterval(downInterval);
          isJumping = false;
        }
        position -= jumpStep;
        if (position < 0) position = 0;
        robson.style.bottom = `calc(17% + ${position}px)`;
      }, intervalTime);
    } else {
      position += jumpStep;
      robson.style.bottom = `calc(17% + ${position}px)`;
    }
  }, intervalTime);
}

// Liga o pulo a teclado e clique
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
    }
});
document.addEventListener('click', (e) => {
  if (e.target === startBtn) return;
  jump();
});

// Função para atualizar o contador de livros
function updateScoreDisplay() {
    scoreDisplay.textContent = `Livros: ${score}`;
}

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

  // *CORREÇÃO DO BUG DE VELOCIDADE*: A velocidade agora é relativa à largura do jogo.
  const gameWidth = getGameWidth();
  // Ajuste para 800px como largura de referência
  const speedFactor = gameWidth / 800; 
  const currentObstacleSpeed = obstacleSpeed * speedFactor;
  const currentCollectibleSpeed = currentObstacleSpeed * 0.8; // Mantém a proporção

  // Atualiza a posição do obstáculo e coletável
  updateObstacle(deltaTime, currentObstacleSpeed);
  updateCollectible(deltaTime, currentCollectibleSpeed);

  // Verifica colisão
  checkCollision();
  checkCollectibleCollision();

  // Agenda o próximo frame
  requestAnimationFrame(gameLoop);
}

// Função para mover o obstáculo
function updateObstacle(deltaTime, speed) {
  if (!obstacleVisible) return;

  let obstaclePosition = parseFloat(getComputedStyle(obstacle).left);
  if (isNaN(obstaclePosition)) {
    obstaclePosition = getGameWidth();
  }

  const displacement = speed * deltaTime;

  // Reinicia o obstáculo quando sai da tela
  if (obstaclePosition < -100) {
    // Oculta o obstáculo e agenda o próximo reaparecimento
    obstacleVisible = false;
    obstacle.style.display = 'none';
    setTimeout(spawnObstacle, Math.random() * 2000 + 1000); // Reaparece aleatoriamente entre 1s e 3s
    return;
  }

  obstaclePosition -= displacement;
  obstacle.style.left = obstaclePosition + 'px';
}

// Função para mover o coletável
function updateCollectible(deltaTime, speed) {
  if (!collectibleVisible) return;

  let collectiblePosition = parseFloat(getComputedStyle(collectible).left);
  if (isNaN(collectiblePosition)) {
    collectiblePosition = getGameWidth();
  }

  const displacement = speed * deltaTime;

  // Reinicia o coletável quando sai da tela
  if (collectiblePosition < -100) {
    collectibleVisible = false;
    collectible.style.display = 'none';
    setTimeout(spawnCollectible, Math.random() * 3000 + 2000); // Reaparece aleatoriamente entre 2s e 5s
    return;
  }

  collectiblePosition -= displacement;
  collectible.style.left = collectiblePosition + 'px';
}

// Função para fazer o obstáculo aparecer
function spawnObstacle() {
    if (!gameStarted) return;
    obstacleVisible = true;
    obstacle.style.display = 'block';
    // Garante que o obstáculo comece fora da tela
    obstacle.style.left = getGameWidth() + 50 + 'px';
}

// Função para fazer o coletável aparecer
function spawnCollectible() {
    if (!gameStarted) return;
    // Não permite que o coletável apareça muito perto do obstáculo
    if (obstacleVisible && parseFloat(getComputedStyle(obstacle).left) > getGameWidth() / 2) {
         setTimeout(spawnCollectible, 1000);
         return;
    }
    collectibleVisible = true;
    collectible.style.display = 'block';
    collectible.style.opacity = 1; // Garante que esteja visível
    // Garante que o coletável comece fora da tela
    collectible.style.left = getGameWidth() + 100 + 'px';
}

// Função para verificar colisão com o obstáculo
function checkCollision() {
  if (!obstacleVisible) return;

  const robsonRect = robson.getBoundingClientRect();
  const obstacleRect = obstacle.getBoundingClientRect();

  // Cria hitboxes "encolhidas" para reduzir falsos positivos
  const shrinkFactor = 0.18;
  const rPadX = robsonRect.width * shrinkFactor;
  const rPadY = robsonRect.height * shrinkFactor;
  const oPadX = obstacleRect.width * 0.12;
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
    // *CORREÇÃO DO BUG DE PAUSA*: A flag gameStarted é usada para parar o gameLoop.
    gameStarted = false;
    document.querySelectorAll('.background').forEach(bg => bg.style.animationPlayState = 'paused');
    gameDiv.classList.add('paused'); // Adiciona a classe de pausa para garantir
    alert(`💥 Game Over! Você coletou ${score} livros.`);
    location.reload();
    return;
  }
}

// Função para verificar colisão com o coletável
function checkCollectibleCollision() {
  if (!collectibleVisible) return;

  const robsonRect = robson.getBoundingClientRect();
  const collectibleRect = collectible.getBoundingClientRect();

  // Hitbox mais generosa para o coletável
  const rLeft = robsonRect.left;
  const rRight = robsonRect.right;
  const rTop = robsonRect.top;
  const rBottom = robsonRect.bottom;

  const cLeft = collectibleRect.left;
  const cRight = collectibleRect.right;
  const cTop = collectibleRect.top;
  const cBottom = collectibleRect.bottom;

  const collided = (rLeft < cRight && rRight > cLeft && rTop < cBottom && rBottom > cTop);

  if (collided) {
    score++;
    updateScoreDisplay();
    collectibleVisible = false;
    collectible.style.opacity = 0; // Efeito de desaparecimento
    // Agenda o próximo coletável
    setTimeout(spawnCollectible, Math.random() * 3000 + 2000);
  }
}

// CENÁRIOS: seleção aleatória e ativação
const cenarios = document.querySelectorAll('.cenario');

function trocarCenarioAleatorio() {
  if (!cenarios || cenarios.length === 0) return;
  cenarios.forEach(c => c.classList.remove('active'));
  const indice = Math.floor(Math.random() * cenarios.length);
  cenarios[indice].classList.add('active');
  obstacleSpeed = obstacleSpeed + 100;  
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
    gameDiv.classList.remove('paused');

    // *CORREÇÃO DO BUG DO OBSTÁCULO NA LARGADA*:
    // O obstáculo e o coletável são spawnados com um pequeno atraso.
    // O obstáculo começa invisível e é spawnado após 1 segundo.
    obstacle.style.display = 'none';
    collectible.style.display = 'none';
    setTimeout(spawnObstacle, 1000);
    setTimeout(spawnCollectible, 3000);

    // Inicia o loop do jogo
    lastTime = performance.now(); // Inicializa lastTime corretamente
    requestAnimationFrame(gameLoop);
  }
});

// troca o cenário a cada 20s
setInterval(() => {
  if (gameStarted) trocarCenarioAleatorio();
}, 20000);

// Troca inicial para garantir que um cenário esteja ativo ao começar
trocarCenarioAleatorio();
