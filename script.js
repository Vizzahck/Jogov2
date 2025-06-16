const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Assets
const imagens = './assets/imagens/';
const sounds = './assets/sounds/';

const imagensNave = ['nave1.png', 'nave2.png', 'nave3.png'];
const imagensInimigos = ['inimigo1.png', 'inimigo2.png', 'inimigo3.png'];
const imagensBoss = ['boss1.png', 'boss2.png', 'boss3.png'];
const powerups = ['powerup_vida.png', 'powerup_escudo.png', 'powerup_tiro.png'];

const fundo = new Image();
fundo.src = `${imagens}fundo_estrelado.png`;

const coracao = new Image();
coracao.src = `${imagens}coracao.png`;

// Sons
const somTiro = new Audio(`${sounds}tiro_nave.wav`);
const somTiroInimigo = new Audio(`${sounds}tiro_inimigo.wav`);
const somExplosao = new Audio(`${sounds}explosao.wav`);
const somPowerup = new Audio(`${sounds}powerup.wav`);
const somDerrota = new Audio(`${sounds}derrota.wav`);
const somVitoria = new Audio(`${sounds}vitoria.wav`);

// Variáveis
let fase = 1;
let vida = 5;
let pontos = 0;
let inimigosDerrotados = 0;
let inimigosParaBoss = 15;
let inimigos = [];
let tiros = [];
let tirosInimigos = [];
let powerUps = [];
let boss = null;
let naveImg = new Image();
let navePos = {x: canvas.width / 2 - 40, y: canvas.height - 120};
let gameOver = false;
let venceu = false;

// HUD
const vidaNave = document.getElementById('vidaNave');
const faseDisplay = document.getElementById('fase');
const finalDiv = document.getElementById('final');
const mensagemFinal = document.getElementById('mensagemFinal');

// Funções auxiliares
function carregarImagemAleatoria(lista) {
    const img = new Image();
    img.src = `${imagens}${lista[Math.floor(Math.random() * lista.length)]}`;
    return img;
}

function resetarFase() {
    vida = 5;
    inimigos = [];
    tiros = [];
    tirosInimigos = [];
    powerUps = [];
    boss = null;
    inimigosDerrotados = 0;
    inimigosParaBoss = Math.floor(15 * Math.pow(1.4, fase - 1));
    naveImg = carregarImagemAleatoria(imagensNave);
    navePos = {x: canvas.width / 2 - 40, y: canvas.height - 120};
    gameOver = false;
    venceu = false;
    vidaNave.innerText = '❤️'.repeat(vida);
    faseDisplay.innerText = `Fase ${fase}`;
    finalDiv.classList.add('hidden');
}

// Criar inimigo
function spawnInimigo() {
    const img = carregarImagemAleatoria(imagensInimigos);
    const x = Math.random() * (canvas.width - 60);
    const y = -60;
    const speed = 2 + fase * 0.3;
    inimigos.push({img, x, y, speed, vida: 1});
}

// Criar boss
function spawnBoss() {
    const img = carregarImagemAleatoria(imagensBoss);
    const x = canvas.width / 2 - 100;
    const y = -200;
    const vidaBoss = Math.floor(30 * Math.pow(1.1, fase - 1));
    boss = {img, x, y, speed: 2, vida: vidaBoss};
}

// Criar powerup
function spawnPowerUp() {
    const img = new Image();
    img.src = `${imagens}${powerups[Math.floor(Math.random() * powerups.length)]}`;
    const x = Math.random() * (canvas.width - 40);
    const y = -40;
    const tipo = img.src.includes('vida') ? 'vida' :
                 img.src.includes('escudo') ? 'escudo' : 'tiro';
    powerUps.push({img, x, y, speed: 3, tipo});
}

// Movimentação
window.addEventListener('mousemove', (e) => {
    navePos.x = e.clientX - 40;
});

// Toque (mobile)
window.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    navePos.x = touch.clientX - 40;
});

// Tiro
setInterval(() => {
    if (!gameOver && !venceu) {
        tiros.push({x: navePos.x + 35, y: navePos.y});
        somTiro.currentTime = 0;
        somTiro.play();
    }
}, 400);

// Loop principal
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(fundo, 0, 0, canvas.width, canvas.height);

    // Nave
    ctx.drawImage(naveImg, navePos.x, navePos.y, 80, 80);

    // Tiros da nave
    tiros.forEach((t, i) => {
        ctx.drawImage(coracao, t.x, t.y, 20, 20);
        t.y -= 8;
        if (t.y < -20) tiros.splice(i, 1);
    });

    // Inimigos
    if (!boss && inimigosDerrotados < inimigosParaBoss) {
        if (Math.random() < 0.02) spawnInimigo();
    }

    inimigos.forEach((inimigo, i) => {
        ctx.drawImage(inimigo.img, inimigo.x, inimigo.y, 60, 60);
        inimigo.y += inimigo.speed;
        if (Math.random() < 0.01) {
            tirosInimigos.push({x: inimigo.x + 30, y: inimigo.y + 60});
            somTiroInimigo.currentTime = 0;
            somTiroInimigo.play();
        }
        if (inimigo.y > canvas.height) inimigos.splice(i, 1);
    });

    // Boss
    if (inimigosDerrotados >= inimigosParaBoss && !boss) spawnBoss();
    if (boss) {
        ctx.drawImage(boss.img, boss.x, boss.y, 200, 200);
        boss.y += boss.speed;
        if (boss.y > 50) boss.y = 50;

        if (Math.random() < 0.02) {
            tirosInimigos.push({x: boss.x + 100, y: boss.y + 200});
            somTiroInimigo.currentTime = 0;
            somTiroInimigo.play();
        }
    }

    // Tiros dos inimigos
    tirosInimigos.forEach((t, i) => {
        ctx.fillStyle = 'red';
        ctx.fillRect(t.x, t.y, 5, 15);
        t.y += 5;
        if (t.y > canvas.height) tirosInimigos.splice(i, 1);
    });

    // PowerUps
    if (Math.random() < 0.001) spawnPowerUp();
    powerUps.forEach((p, i) => {
        ctx.drawImage(p.img, p.x, p.y, 40, 40);
        p.y += p.speed;
        if (p.y > canvas.height) powerUps.splice(i, 1);
    });

    // Colisões
    tiros.forEach((t, ti) => {
        inimigos.forEach((in, ii) => {
            if (t.x < in.x + 60 && t.x + 20 > in.x &&
                t.y < in.y + 60 && t.y + 20 > in.y) {
                inimigos.splice(ii, 1);
                tiros.splice(ti, 1);
                inimigosDerrotados++;
                somExplosao.currentTime = 0;
                somExplosao.play();
            }
        });
        if (boss && t.x < boss.x + 200 && t.x + 20 > boss.x &&
            t.y < boss.y + 200 && t.y + 20 > boss.y) {
            boss.vida--;
            tiros.splice(ti, 1);
            somExplosao.currentTime = 0;
            somExplosao.play();
            if (boss.vida <= 0) boss = null;
        }
    });

    tirosInimigos.forEach((t, i) => {
        if (t.x < navePos.x + 80 && t.x + 5 > navePos.x &&
            t.y < navePos.y + 80 && t.y + 15 > navePos.y) {
            vida--;
            tirosInimigos.splice(i, 1);
            vidaNave.innerText = '❤️'.repeat(vida);
            if (vida <= 0) {
                somDerrota.play();
                gameOver = true;
                setTimeout(resetarFase, 1500);
            }
        }
    });

    powerUps.forEach((p, i) => {
        if (p.x < navePos.x + 80 && p.x + 40 > navePos.x &&
            p.y < navePos.y + 80 && p.y + 40 > navePos.y) {
            if (p.tipo === 'vida') vida = Math.min(vida + 1, 5);
            if (p.tipo === 'escudo') vida = Math.min(vida + 2, 5);
            if (p.tipo === 'tiro') { /* poderia melhorar o tiro futuramente */ }
            vidaNave.innerText = '❤️'.repeat(vida);
            powerUps.splice(i, 1);
            somPowerup.play();
        }
    });

    // Próxima fase ou vitória final
    if (!boss && inimigosDerrotados >= inimigosParaBoss) {
        if (fase < 21) {
            fase++;
            setTimeout(resetarFase, 1500);
        } else {
            somVitoria.play();
            venceu = true;
            finalDiv.classList.remove('hidden');
            mensagemFinal.innerText = `Viu amor, às vezes nosso relacionamento vai ser difícil, 
mas se continuarmos lutando juntos, venceremos qualquer desafio! Te amo ❤️`;
        }
    }

    if (!gameOver && !venceu) requestAnimationFrame(loop);
}

// Iniciar
resetarFase();
loop();
