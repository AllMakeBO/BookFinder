const robson = document.querySelector('.robson');
const obstacle = document.querySelector('.obstacle');
const collectible = document.querySelector('.collectible'); // Novo coletável
const startBtn = document.getElementById('startBtn');
const main = document.getElementById('main');
const gameDiv = document.querySelector('.game');
const scoreDisplay = document.getElementById('scoreDisplay');
// Link direto para o som de pulo do Mario. Se este link não funcionar,
// o som pode estar sendo bloqueado por políticas de autoplay ou CORS.
const jumpSound = new Audio('https://www.myinstants.com/media/sounds/jump.mp3'); 
// Som de coleta de item (moeda do Mario)
const collectSound = new Audio('https://www.myinstants.com/media/sounds/smb_coin.mp3');
// Som de Game Over
const gameOverSound = new Audio('https://www.myinstants.com/media/sounds/smb_gameover.mp3');

// Tenta pré-carregar o áudio para evitar atrasos na reprodução
jumpSound.load();
collectSound.load();

let isJumping = false;
let position = 0;
let gameStarted = false;
let lastTime = 0;
let obstacleSpeed = 500; // Velocidade base em pixels/segundo, agora será ajustada para ser relativa
let collectibleSpeed = obstacleSpeed * 0.8; // Coletável um pouco mais lento que o obstáculo
let score = 0;
let obstacleVisible = false; // Controla se o obstáculo está visível/ativo
let collectibleVisible = false; // Controla se o coletável está visível/ativo

// Função para obter a largura real do contêiner do jogo
function getGameWidth() {
    return gameDiv.clientWidth;
}

const obstacleDesign = [
    'url("https://uploads.onecompiler.io/43s2gpp6m/43zmwht6b/Rock.png")', // Obstáculo: Pedras
    'url("https://uploads.onecompiler.io/43s2gpp6m/43zmwht6b/Bricks.png")', // Obstáculo: Tijolo
    'url("https://uploads.onecompiler.io/43s2gpp6m/43zmwht6b/Cone.png")', // Obstáculo: Cone
    'url("https://uploads.onecompiler.io/43s2gpp6m/43zmwht6b/Box.png")', // Obstáculo: Caixa
];

// Função de pulo
function jump() {
  if (!gameStarted) return;
  if (isJumping) return; 
  isJumping = true;
  
  // Tenta tocar o som. Se falhar (por exemplo, devido a políticas de autoplay),
  // o erro é silenciado para não quebrar o jogo.
  try {
      jumpSound.currentTime = 0; // Reinicia o áudio
      jumpSound.play(); // Toca o som de pulo
  } catch (e) {
      console.error("Erro ao tentar tocar o som de pulo:", e);
      // O som não será tocado, mas o jogo continua
  }

  const altura = gameDiv.clientHeight;
  const jumpHeight = altura * 0.30;
  // O passo do pulo agora é proporcional à altura do jogo, garantindo velocidade consistente
  const jumpStep = jumpHeight / 30; // Ex: Se jumpHeight for 200px, o passo é 20px
  const intervalTime = 9;

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
  // Aumenta a velocidade base gradualmente a cada frame
  obstacleSpeed += 0.05 * deltaTime; // Aumento sutil e constante de dificuldade
  collectibleSpeed = obstacleSpeed * 0.8; // Mantém a proporção
  
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
  gameStarted = false;
  document.querySelectorAll('.background').forEach(bg => bg.style.animationPlayState = 'paused');
  gameDiv.classList.add('paused');

  // Toca o som de Game Over
  try {
      gameOverSound.currentTime = 0;
      gameOverSound.play();
  } catch (e) {
      console.error("Erro ao tentar tocar o som de Game Over:", e);
  }

  // Se o jogador coletou 10 ou mais livros, mostra uma curiosidade aleatória
  if (score >= 10) {
    mostrarCuriosidade();
  }

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
    
    // Toca o som de coleta
    try {
        collectSound.currentTime = 0;
        collectSound.play();
    } catch (e) {
        console.error("Erro ao tentar tocar o som de coleta:", e);
    }

    // Agenda o próximo coletável
    setTimeout(spawnCollectible, Math.random() * 3000 + 2000);
  }
}

// CENÁRIOS: seleção aleatória e ativação
const cenarios = document.querySelectorAll('.cenario');

function trocarCenarioAleatorio() {
  if (!cenarios || cenarios.length === 0) return;
  
  // Encontra o cenário ativo atual (se houver)
  const cenarioAtual = document.querySelector('.cenario.active');

  // Seleciona um novo cenário aleatório, garantindo que não seja o mesmo
  let indice;
  let novoCenario;
  do {
      indice = Math.floor(Math.random() * cenarios.length);
      novoCenario = cenarios[indice];
  } while (cenarioAtual && novoCenario === cenarioAtual);

  // Remove a classe 'active' do cenário atual para iniciar o fade-out
  if (cenarioAtual) {
    cenarioAtual.classList.remove('active');
  }
  
  // Adiciona a classe 'active' ao novo cenário após um pequeno atraso
  // O atraso de 100ms é para garantir que o cenário anterior comece a transição de opacidade.
  // A transição de 1s está no CSS.
  setTimeout(() => {
      novoCenario.classList.add('active');
  }, 100); 

  // Aumento de velocidade removido daqui, pois agora é gradual no gameLoop.
  // Isso evita picos de dificuldade abruptos na troca de cenário.
  
  const obstacleRandom = obstacleDesign[Math.floor(Math.random() * obstacleDesign.length)];
  obstacle.style.backgroundImage = obstacleRandom;
}

// inicia o jogo ao clicar no botão
startBtn.addEventListener('click', () => {
  if (!gameStarted) {
    gameStarted = true;
    startBtn.style.display = 'none';
    main.style.display = 'block';
    // Tenta tocar o som uma vez após o clique inicial do usuário,
    // o que pode ajudar a desbloquear o autoplay em alguns navegadores.
    try {
        jumpSound.play().catch(e => console.log("Autoplay bloqueado na inicialização."));
    } catch (e) {
        // Ignora erros de inicialização
    }
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
// A troca inicial precisa ser síncrona, pois o jogo ainda não começou.
if (cenarios && cenarios.length > 0) {
    const indice = Math.floor(Math.random() * cenarios.length);
    cenarios[indice].classList.add('active');
}

// --- LISTA DE CURIOSIDADES ---
const curiosidades = [
"Dom Quixote - (1612) - Uma continuação não autorizada (fanfic) teria motivado Cervantes a matar o protagonista no segundo volume.",
"Dom Quixote - (1612) - Miguel de Cervantes foi prisioneiro de piratas por cinco anos.",
"Dom Quixote - (1612) - O livro é lido em voz alta em eventos anuais na Espanha.",
"Dom Quixote - (1612) - A obra é considerada um dos primeiros romances modernos.",
"O Pequeno Príncipe - (1943) - O autor, Antoine de Saint-Exupéry, era piloto de avião, assim como o narrador do livro.",
"O Pequeno Príncipe - (1943) - As ilustrações originais foram feitas pelo próprio autor.",
"O Pequeno Príncipe - (1943) - O livro foi inicialmente publicado nos Estados Unidos, não na França.",
"O Pequeno Príncipe - (1943) - A obra foi proibida na Argentina durante a ditadura militar.",
"O Pequeno Príncipe - (1943) - Existe um asteroide chamado 46610 Bésixdouze, uma referência ao asteroide B-612 do livro.",
"O Senhor dos Anéis - (1954–1955) - J.R.R. Tolkien criou vários idiomas completos para as raças de seu universo, como o Quenya e o Sindarin dos elfos.",
"O Senhor dos Anéis - (1954–1955) - O ator Christopher Lee, que interpretou Saruman nos filmes, foi o único membro do elenco que conheceu Tolkien pessoalmente.",
"O Senhor dos Anéis - (1954–1955) - Tolkien considerava Samwise Gamgee o verdadeiro herói da história.",
"O Senhor dos Anéis - (1954–1955) - A Terra-Média foi concebida por uma divindade suprema chamada Eru Ilúvatar.",
"O Senhor dos Anéis - (1954–1955) - O livro levou mais de 12 anos para ser concluído.",
"Harry Potter e a Pedra Filosofal - (1997) - J.K. Rowling escreveu o rascunho inicial do livro em guardanapos de papel em um café em Edimburgo.",
"Harry Potter e a Pedra Filosofal - (1997) - O nome de Hogwarts foi inspirado em uma planta que a autora viu no Kew Gardens, em Londres.",
"Harry Potter e a Pedra Filosofal - (1997) - O primeiro livro foi rejeitado por 12 editoras antes de ser publicado pela Bloomsbury.",
"Harry Potter e a Pedra Filosofal - (1997) - Nos Estados Unidos, o título foi alterado para *Harry Potter and the Sorcerer's Stone*.",
"Harry Potter e a Pedra Filosofal - (1997) - A estação de King's Cross tem um significado especial para Rowling, pois foi onde seus pais se conheceram.",
"O Hobbit - (1937) - A palavra “hobbit” já existia na língua inglesa antes do livro, mas com um significado diferente.",
"O Hobbit - (1937) - Tolkien odiava as animações da Disney e esperava que seu trabalho nunca fosse adaptado por eles.",
"O Hobbit - (1937) - A história foi criada por Tolkien para seus filhos.",
"O Hobbit - (1937) - A primeira edição foi ilustrada pelo próprio autor.",
"O Hobbit - (1937) - A mãe de Bilbo, Belladonna Took, é a única personagem feminina mencionada no livro.",
"E não sobrou nenhum - (1939) - O título original do livro era *Ten Little Niggers*, alterado posteriormente por ser considerado ofensivo.",
"E não sobrou nenhum - (1939) - A história foi adaptada para o teatro pela própria Agatha Christie, que mudou o final.",
"E não sobrou nenhum - (1939) - É o livro de mistério mais vendido de todos os tempos.",
"E não sobrou nenhum - (1939) - A trama se passa em uma ilha isolada na costa de Devon, Inglaterra.",
"E não sobrou nenhum - (1939) - A identidade do assassino é revelada em uma mensagem dentro de uma garrafa encontrada no final.",
"O Código Da Vinci - (2003) - O livro gerou grande controvérsia com a Igreja Católica por suas teorias sobre a história do cristianismo.",
"O Código Da Vinci - (2003) - O diretor Ron Howard queria Bill Paxton para o papel de Robert Langdon, mas o ator não estava disponível.",
"O Código Da Vinci - (2003) - A trama envolve uma caça ao tesouro por Paris e Londres, baseada em obras de Leonardo da Vinci.",
"O Código Da Vinci - (2003) - O livro popularizou a ideia de que Jesus e Maria Madalena eram casados e tiveram filhos.",
"O Código Da Vinci - (2003) - Muitas das locações descritas no livro, como o Museu do Louvre, viraram pontos turísticos populares.",
"O Leão, a Feiticeira e o Guarda-Roupa - (1950) - C.S. Lewis se inspirou em três garotas que ele conheceu durante a Segunda Guerra Mundial para criar as irmãs Pevensie.",
"O Leão, a Feiticeira e o Guarda-Roupa - (1950) - A primeira adaptação para a TV foi em 1967.",
"O Leão, a Feiticeira e o Guarda-Roupa - (1950) - Aslam, o leão, é uma representação de Jesus Cristo.",
"O Leão, a Feiticeira e o Guarda-Roupa - (1950) - O filme de 2005 ganhou um Oscar de Melhor Maquiagem.",
"O Leão, a Feiticeira e o Guarda-Roupa - (1950) - O nome Nárnia foi inspirado em uma cidade italiana chamada Narni.",
"O Alquimista - (1988) - Paulo Coelho escreveu o livro em apenas duas semanas.",
"O Alquimista - (1988) - O livro foi inspirado na jornada pessoal do autor em busca de seu propósito.",
"O Alquimista - (1988) - A primeira edição vendeu pouquíssimas cópias e a editora decidiu não reimprimir.",
"O Alquimista - (1988) - Madonna foi uma das primeiras celebridades a endossar publicamente o livro.",
"O Alquimista - (1988) - O livro detém o recorde do Guinness de livro mais traduzido de um autor vivo.",
"O Apanhador no Campo de Centeio - (1951) - O livro foi associado ao assassinato de John Lennon, pois o assassino, Mark David Chapman, o carregava no momento.",
"O Apanhador no Campo de Centeio - (1951) - O autor, J. D. Salinger, era extremamente recluso e proibiu qualquer adaptação cinematográfica da obra.",
"O Apanhador no Campo de Centeio - (1951) - O livro foi rejeitado por várias editoras antes de ser publicado.",
"O Apanhador no Campo de Centeio - (1951) - O romance é frequentemente banido em escolas americanas devido à sua linguagem e temas controversos.",
"O Apanhador no Campo de Centeio - (1951) - O título é uma referência a um poema de Robert Burns, mal interpretado pelo protagonista Holden Caulfield.",
"Cem Anos de Solidão - (1967) - O livro é o expoente máximo do realismo mágico, um estilo literário que mistura o fantástico com o cotidiano.",
"Cem Anos de Solidão - (1967) - Macondo, a cidade fictícia do livro, é inspirada na cidade natal do autor, Aracataca, na Colômbia.",
"Cem Anos de Solidão - (1967) - Gabriel García Márquez se inspirou em sua avó para criar a personagem Úrsula Iguarán.",
"Cem Anos de Solidão - (1967) - O autor só conseguiu publicar o livro depois de penhorar o carro para enviar o manuscrito para a editora.",
"Cem Anos de Solidão - (1967) - A obra foi traduzida para mais de 35 idiomas e vendeu mais de 50 milhões de cópias.",
"Lolita - (1955) - O livro foi inicialmente publicado em Paris devido ao medo de censura nos Estados Unidos.",
"Lolita - (1955) - O primeiro roteiro que Nabokov entregou para Stanley Kubrick, para a adaptação de 1962, tinha 400 páginas e resultaria em um filme de 7 horas.",
"Lolita - (1955) - O nome 'Lolita' se tornou um termo popular para descrever uma menina sexualmente precoce, embora o autor tenha rejeitado essa interpretação.",
"Lolita - (1955) - Nabokov escreveu o livro em inglês, apesar de ser russo, e considerava o inglês sua segunda língua.",
"Lolita - (1955) - O livro foi banido em vários países, incluindo França e Reino Unido, logo após o seu lançamento.",
"Um Conto de Duas Cidades - (1859) - A principal fonte histórica de Charles Dickens para o livro foi *A Revolução Francesa*, de Thomas Carlyle.",
"Um Conto de Duas Cidades - (1859) - A obra é o romance histórico mais vendido de todos os tempos.",
"Um Conto de Duas Cidades - (1859) - O livro foi publicado em 31 partes semanais, o que era comum para Dickens na época.",
"Um Conto de Duas Cidades - (1859) - A frase de abertura, 'Era o melhor dos tempos, era o pior dos tempos', é uma das mais famosas da literatura.",
"Um Conto de Duas Cidades - (1859) - A história se passa em Londres e Paris durante a Revolução Francesa.",
"O Sonho da Câmara Vermelha - (1754–1791) - É um dos Quatro Grandes Romances Clássicos da literatura chinesa.",
"O Sonho da Câmara Vermelha - (1754–1791) - O livro foi escrito em chinês vernáculo, não em chinês clássico, o que o tornou mais acessível ao público.",
"O Sonho da Câmara Vermelha - (1754–1791) - A obra é também conhecida como *A História da Pedra*.",
"O Sonho da Câmara Vermelha - (1754–1791) - O estudo do livro, conhecido como 'Redologia', é um campo acadêmico por si só.",
"O Sonho da Câmara Vermelha - (1754–1791) - O romance narra a ascensão e queda da rica e aristocrática família Jia, durante a Dinastia Qing.",
"Ela, a Feiticeira - (1887) - O livro foi um dos romances mais vendidos da era vitoriana e inspirou o gênero de 'mundos perdidos'.",
"Ela, a Feiticeira - (1887) - O autor, H. Rider Haggard, escreveu o livro em apenas seis semanas.",
"Ela, a Feiticeira - (1887) - A personagem 'Ayesha' (Ela) é uma das figuras femininas mais icônicas da literatura de aventura.",
"Ela, a Feiticeira - (1887) - O livro foi adaptado para o cinema várias vezes, a primeira em 1911.",
"Ela, a Feiticeira - (1887) - O autor foi nomeado Sir devido aos seus serviços em comissões governamentais.",
"Pense e Enriqueça - (1937) - O autor, Napoleon Hill, passou 25 anos pesquisando mais de 500 milionários, incluindo Andrew Carnegie e Henry Ford.",
"Pense e Enriqueça - (1937) - O livro foi baseado em uma 'fórmula' de sucesso que Hill desenvolveu a partir de suas entrevistas.",
"Pense e Enriqueça - (1937) - A obra é considerada um dos pilares da literatura de autoajuda.",
"Pense e Enriqueça - (1937) - O livro foi um bestseller durante a Grande Depressão, oferecendo esperança e motivação.",
"Pense e Enriqueça - (1937) - O conceito de 'Master Mind' (Mente Mestra) é central para a filosofia do livro.",
"Heidi - (1880) - O livro foi publicado em duas partes: a primeira em 1880 e a segunda em 1881.",
"Heidi - (1880) - A cidade de Maienfeld, na Suíça, onde a história se passa, se tornou um ponto turístico conhecido como 'Heidiland'.",
"Heidi - (1880) - A autora, Johanna Spyri, foi acusada de plagiar uma história de 1830 chamada *Adelheid, a menina dos Alpes*.",
"Heidi - (1880) - O livro nunca saiu de catálogo desde a sua primeira publicação.",
"Heidi - (1880) - A história foi adaptada para um famoso anime japonês em 1974.",
"Meu Filho, Meu Tesouro - (1946) - O livro foi o segundo mais vendido do século XX nos Estados Unidos, perdendo apenas para a Bíblia.",
"Meu Filho, Meu Tesouro - (1946) - O autor, Dr. Benjamin Spock, foi um pediatra que revolucionou a criação de filhos ao defender uma abordagem mais flexível e amorosa.",
"Meu Filho, Meu Tesouro - (1946) - A primeira edição do livro aconselhava os pais a confiarem mais em seus próprios instintos do que em regras rígidas.",
"Meu Filho, Meu Tesouro - (1946) - Dr. Spock se tornou uma figura controversa por seu ativismo político contra a Guerra do Vietnã.",
"Meu Filho, Meu Tesouro - (1946) - O livro foi traduzido para mais de 40 idiomas.",
"Anne of Green Gables - (1908) - A autora, Lucy Maud Montgomery, baseou a fictícia Avonlea em sua cidade natal, na Ilha do Príncipe Eduardo, Canadá.",
"Anne of Green Gables - (1908) - O livro foi um sucesso de vendas imediato, com seis reedições no primeiro ano.",
"Anne of Green Gables - (1908) - A história é extremamente popular no *****ão, onde é vista como um conto sobre a importância da individualidade e da natureza.",
"Anne of Green Gables - (1908) - O primeiro nome da protagonista, Anne, é escrito com um 'e' no final, para distingui-la de outras Anns.",
"Anne of Green Gables - (1908) - A autora considerou que a história era muito 'simples' e a enviou para várias editoras antes de ser aceita.",
"Beleza Negra - (1877) - O livro é narrado por um cavalo, o que era incomum para a época.",
"Beleza Negra - (1877) - A autora, Anna Sewell, escreveu o livro para promover a bondade e o tratamento humano dos cavalos.",
"Beleza Negra - (1877) - O livro foi o único romance que Sewell escreveu.",
"Beleza Negra - (1877) - A autora morreu apenas cinco meses após a publicação do livro, mas viveu o suficiente para ver o seu sucesso.",
"Beleza Negra - (1877) - O livro é considerado um dos mais influentes na história dos direitos dos animais.",
"O Nome da Rosa - (1980) - O autor, Umberto Eco, era um renomado semiólogo e filósofo, e o livro reflete seu conhecimento em linguística e história medieval.",
"O Nome da Rosa - (1980) - A história se passa em um mosteiro beneditino no século XIV.",
"O Nome da Rosa - (1980) - O livro foi adaptado para um filme em 1986, estrelado por Sean Connery.",
"O Nome da Rosa - (1980) - O título é uma referência a uma linha do poema latino *De contemptu mundi* (Sobre o desprezo do mundo).",
"O Nome da Rosa - (1980) - Eco levou mais de 10 anos para escrever o livro.",
"Uma Lagarta Muito Comilona - (1969) - O livro tem buracos nas páginas para mostrar o caminho da lagarta, o que era uma inovação na época.",
"Uma Lagarta Muito Comilona - (1969) - O autor, Eric Carle, se inspirou em um furador de papel para criar os buracos.",
"Uma Lagarta Muito Comilona - (1969) - O livro é usado para ensinar as crianças sobre os dias da semana e a metamorfose.",
"Uma Lagarta Muito Comilona - (1969) - O livro foi traduzido para mais de 60 idiomas.",
"Uma Lagarta Muito Comilona - (1969) - A lagarta come 26 alimentos diferentes ao longo da história.",
"Mil Novecentos e Oitenta e Quatro - (1949) - O termo 'Novilíngua' (Newspeak), criado por George Orwell no livro, se tornou parte do vocabulário político.",
"Mil Novecentos e Oitenta e Quatro - (1949) - O livro popularizou o conceito de 'Big Brother' (Grande Irmão) como uma vigilância governamental opressiva.",
"Mil Novecentos e Oitenta e Quatro - (1949) - O título original seria *O Último Homem na Europa*, mas foi alterado pelo editor.",
"Mil Novecentos e Oitenta e Quatro - (1949) - O livro foi escrito enquanto Orwell estava gravemente doente de tuberculose.",
"Mil Novecentos e Oitenta e Quatro - (1949) - O nome do protagonista, Winston Smith, é uma combinação do nome de Winston Churchill e o sobrenome mais comum na Inglaterra.",
"O Poderoso Chefão - (1969) - O autor, Mario Puzo, escreveu o livro para sair de dívidas, e ele se tornou um sucesso imediato.",
"O Poderoso Chefão - (1969) - O livro foi adaptado para um filme icônico em 1972, dirigido por Francis Ford Coppola.",
"O Poderoso Chefão - (1969) - A palavra 'Capo' (Chefe) é usada no livro para se referir ao líder da máfia.",
"O Poderoso Chefão - (1969) - Puzo admitiu que a maior parte das informações sobre a Máfia no livro foi baseada em pesquisa, e não em experiência pessoal.",
"O Poderoso Chefão - (1969) - O livro popularizou a frase 'Vou fazer-lhe uma oferta que ele não poderá recusar'.",
"A História Sem Fim - (1979) - O livro foi escrito em alemão e se chama *Die unendliche Geschichte*.",
"A História Sem Fim - (1979) - O autor, Michael Ende, odiou a adaptação cinematográfica de 1984, chegando a processar os produtores.",
"A História Sem Fim - (1979) - O livro é dividido em 26 capítulos, cada um começando com uma letra do alfabeto.",
"A História Sem Fim - (1979) - A capa original do livro era feita de seda, com dois tons de cor, para representar os dois mundos da história.",
"A História Sem Fim - (1979) - A história é uma metáfora sobre a importância da imaginação e da leitura.",
"Os Pilares da Terra - (1989) - O livro levou três anos para ser escrito, e o autor, Ken Follett, o considerou um desvio de seu gênero habitual (thriller).",
"Os Pilares da Terra - (1989) - A história se passa na Inglaterra do século XII e narra a construção de uma catedral gótica.",
"Os Pilares da Terra - (1989) - O livro foi um sucesso de vendas surpreendente, tornando-se o mais vendido de Follett.",
"Os Pilares da Terra - (1989) - O livro foi adaptado para uma minissérie de televisão em 2010.",
"Os Pilares da Terra - (1989) - O autor pesquisou extensivamente sobre a arquitetura medieval para garantir a precisão da obra.",
"O Perfume - (1985) - O livro foi o primeiro e único romance do autor, Patrick Süskind, a se tornar um bestseller mundial.",
"O Perfume - (1985) - O autor é extremamente recluso e raramente concede entrevistas.",
"O Perfume - (1985) - A história se passa na França do século XVIII e narra a vida de um assassino com um olfato extraordinário.",
"O Perfume - (1985) - O livro foi adaptado para um filme em 2006, dirigido por Tom Tykwer.",
"O Perfume - (1985) - O livro é conhecido por suas descrições sensoriais intensas, especialmente de cheiros.",
"As Vinhas da Ira - (1939) - O livro ganhou o Prêmio Pulitzer de Ficção em 1940.",
"As Vinhas da Ira - (1939) - O autor, John Steinbeck, viajou com trabalhadores migrantes durante a Grande Depressão para escrever o livro.",
"As Vinhas da Ira - (1939) - O livro foi banido e queimado em algumas cidades americanas por seu retrato da pobreza e do ativismo sindical.",
"As Vinhas da Ira - (1939) - O título é uma referência a um hino de batalha da Guerra Civil Americana.",
"As Vinhas da Ira - (1939) - O livro é considerado um dos grandes romances americanos do século XX.",
"O Velho e o Mar - (1952) - O livro foi a última obra de ficção publicada por Ernest Hemingway em vida.",
"O Velho e o Mar - (1952) - O livro foi fundamental para que Hemingway ganhasse o Prêmio Nobel de Literatura em 1954.",
"O Velho e o Mar - (1952) - A história é uma alegoria sobre a luta do homem contra a natureza e a perseverança.",
"O Velho e o Mar - (1952) - Hemingway escreveu o livro em apenas oito semanas.",
"O Velho e o Mar - (1952) - O livro foi adaptado para o cinema várias vezes, a mais famosa em 1958, estrelada por Spencer Tracy.",
"A Fantástica Fábrica de Chocolate - (1964) - O autor, Roald Dahl, foi um espião britânico durante a Segunda Guerra Mundial.",
"A Fantástica Fábrica de Chocolate - (1964) - O livro foi inspirado na experiência de Dahl em uma fábrica de chocolate quando era criança.",
"A Fantástica Fábrica de Chocolate - (1964) - O personagem Willy Wonka foi originalmente concebido como um 'anão negro', mas foi alterado após críticas.",
"A Fantástica Fábrica de Chocolate - (1964) - O livro foi adaptado para dois filmes: *Willy Wonka & the Chocolate Factory* (1971) e *Charlie and the Chocolate Factory* (2005).",
"A Fantástica Fábrica de Chocolate - (1964) - O livro tem uma sequência menos conhecida, *Charlie e o Grande Elevador de Vidro*.",
"O Mundo Se Despedaça - (1958) - O livro é considerado um marco da literatura africana e é o romance mais lido da Nigéria.",
"O Mundo Se Despedaça - (1958) - O título é uma citação do poema *The Second Coming*, de W. B. Yeats.",
"O Mundo Se Despedaça - (1958) - O autor, Chinua Achebe, escreveu o livro como uma resposta aos retratos ocidentais estereotipados da África.",
"O Mundo Se Despedaça - (1958) - O livro foi traduzido para mais de 50 idiomas.",
"O Mundo Se Despedaça - (1958) - O romance narra a vida de Okonkwo, um guerreiro Igbo, e o impacto da chegada dos missionários cristãos e do governo colonial.",
"Harry Potter (Série) - (1997) - J.K. Rowling concebeu a ideia da série durante um atraso de trem em 1990.",
"Harry Potter (Série) - (1997) - O lema de Hogwarts é 'Draco Dormiens Nunquam Titillandus', que significa 'Nunca cutuque um dragão adormecido'.",
"Harry Potter (Série) - (1997) - A autora e o protagonista, Harry Potter, compartilham a mesma data de aniversário: 31 de julho.",
"Harry Potter (Série) - (1997) - O ator Alan Rickman (Severus Snape) foi um dos poucos a saber do destino de seu personagem antes do último livro ser lançado.",
"Harry Potter (Série) - (1997) - Os Dementadores foram criados por Rowling como uma metáfora para a depressão que ela enfrentou.",
"Goosebumps (Série) - (1992) - O autor, R. L. Stine, escreve o título do livro primeiro e só depois cria a história.",
"Goosebumps (Série) - (1992) - Stine foi contratado inicialmente para escrever apenas quatro livros da série.",
"Goosebumps (Série) - (1992) - O primeiro livro da série, *Welcome to Dead House*, foi considerado muito assustador pelo próprio autor.",
"Goosebumps (Série) - (1992) - A série tem mais de 60 livros na sua coleção principal e vários spin-offs.",
"Goosebumps (Série) - (1992) - A série foi traduzida para mais de 32 idiomas.",
"As Crônicas de Nárnia (Série) - (1950) - O leão Aslan é considerado uma representação alegórica de Jesus Cristo.",
"As Crônicas de Nárnia (Série) - (1950) - O autor, C. S. Lewis, e J. R. R. Tolkien eram amigos e faziam parte de um grupo literário chamado 'The Inklings'.",
"As Crônicas de Nárnia (Série) - (1950) - Lewis afirmou que as alusões cristãs não foram intencionais, mas que a história simplesmente 'surgiu' dessa forma.",
"As Crônicas de Nárnia (Série) - (1950) - O livro *O Sobrinho do Mago* (1955) foi escrito como uma prequela, mas é cronologicamente o primeiro da série.",
"As Crônicas de Nárnia (Série) - (1950) - A primeira adaptação de *O Leão, a Feiticeira e o Guarda-Roupa* para a TV foi em 1967.",
"Crepúsculo (Série) - (2005) - A autora, Stephenie Meyer, sonhou com a cena em que o vampiro Edward e a humana Bella estão em um campo, o que a inspirou a escrever o livro.",
"Crepúsculo (Série) - (2005) - A série foi traduzida para 38 idiomas e vendeu mais de 120 milhões de cópias mundialmente.",
"Crepúsculo (Série) - (2005) - O nome 'Isabella Swan' foi escolhido pela autora por ser um nome que ela sempre gostou.",
"Crepúsculo (Série) - (2005) - O livro foi inicialmente rejeitado por 14 agentes literários.",
"Crepúsculo (Série) - (2005) - O personagem Jacob Black (Taylor Lautner) quase foi substituído no segundo filme devido a preocupações com sua forma física.",
"Heidi - (1880) - A cidade de Maienfeld, na Suíça, onde a história se passa, se tornou um ponto turístico conhecido como 'Heidiland'.",
"Heidi - (1880) - A autora, Johanna Spyri, foi acusada de plagiar uma história de 1830 chamada *Adelheid, a menina dos Alpes*.",
"Heidi - (1880) - O livro nunca saiu de catálogo desde a sua primeira publicação.",
"Heidi - (1880) - A história foi adaptada para um famoso anime japonês em 1974, dirigido por Isao Takahata e Hayao Miyazaki.",
"Heidi - (1880) - O livro original foi publicado em duas partes: a primeira em 1880 e a segunda em 1881.",
"Meu Filho, Meu Tesouro - (1946) - O livro foi o segundo mais vendido do século XX nos Estados Unidos, perdendo apenas para a Bíblia.",
"Meu Filho, Meu Tesouro - (1946) - O autor, Dr. Benjamin Spock, foi um pediatra que revolucionou a criação de filhos ao defender uma abordagem mais flexível e amorosa.",
"Meu Filho, Meu Tesouro - (1946) - A primeira edição do livro aconselhava os pais a confiarem mais em seus próprios instintos do que em regras rígidas.",
"Meu Filho, Meu Tesouro - (1946) - Dr. Spock se tornou uma figura controversa por seu ativismo político contra a Guerra do Vietnã.",
"Meu Filho, Meu Tesouro - (1946) - O livro foi traduzido para mais de 40 idiomas.",
"Anne of Green Gables - (1908) - A autora, Lucy Maud Montgomery, baseou a fictícia Avonlea em sua cidade natal, na Ilha do Príncipe Eduardo, Canadá.",
"Anne of Green Gables - (1908) - O livro foi um sucesso de vendas imediato, com seis reedições no primeiro ano.",
"Anne of Green Gables - (1908) - A história é extremamente popular no *****ão, onde é vista como um conto sobre a importância da individualidade e da natureza.",
"Anne of Green Gables - (1908) - O primeiro nome da protagonista, Anne, é escrito com um 'e' no final, para distingui-la de outras Anns.",
"Anne of Green Gables - (1908) - A autora considerou que a história era muito 'simples' e a enviou para várias editoras antes de ser aceita.",
"Beleza Negra - (1877) - O livro é narrado por um cavalo, o que era incomum para a época.",
"Beleza Negra - (1877) - A autora, Anna Sewell, escreveu o livro para promover a bondade e o tratamento humano dos cavalos.",
"Beleza Negra - (1877) - O livro foi o único romance que Sewell escreveu.",
"Beleza Negra - (1877) - A autora morreu apenas cinco meses após a publicação do livro, mas viveu o suficiente para ver o seu sucesso.",
"Beleza Negra - (1877) - O livro é considerado um dos mais influentes na história dos direitos dos animais.",
"O Nome da Rosa - (1980) - O autor, Umberto Eco, era um renomado semiólogo e filósofo, e o livro reflete seu conhecimento em linguística e história medieval.",
"O Nome da Rosa - (1980) - A história se passa em um mosteiro beneditino no século XIV.",
"O Nome da Rosa - (1980) - O livro foi adaptado para um filme em 1986, estrelado por Sean Connery.",
"O Nome da Rosa - (1980) - O título é uma referência a uma linha do poema latino *De contemptu mundi* (Sobre o desprezo do mundo).",
"O Nome da Rosa - (1980) - Eco levou mais de 10 anos para escrever o livro.",
"Uma Lagarta Muito Comilona - (1969) - O livro tem buracos nas páginas para mostrar o caminho da lagarta, o que era uma inovação na época.",
];

function mostrarCuriosidade() {
    const curiosidade = curiosidades[Math.floor(Math.random() * curiosidades.length)];
    alert(`Curiosidade Literária: ${curiosidade}`);
}
