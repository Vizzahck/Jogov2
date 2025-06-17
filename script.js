const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// 📦 Carregar imagens
const imagens = {};
const nomesImagens = [
    'nave1', 'nave2', 'nave3', 'boss1', 'boss2', 'boss3', 'coracao',
    'fundo_estrelado', 'inimigo1', 'inimigo2', 'inimigo3',
    'powerup_escudo', 'powerup_tiro', 'powerup_vida',
    'tiro_nave', 'tiro_inimigo'
];

nomesImagens.forEach(nome => {
    const img = new Image();
    img.src = `assets/imagens/${nome}.png`;
    imagens[nome] = img;
});

// 🎧 Sons
const sons = {};
const nomesSons = [
    'derrota', 'explosao', 'powerup',
    'tiro_inimigo', 'tiro_nave', 'vitoria'
];

nomesSons.forEach(nome => {
    const audio = new Audio(`assets/sounds/${nome}.wav`);
    audio.volume = 0.5;
    sons[nome] = audio;
});

// 🚀 Nave
const nave = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    width: 80,
    height: 80,
    speed: 10,
    img: imagens['nave1'],
    vida: 100
};

// 🎯 Controles
let toque = false;
canvas.addEventListener('touchstart', (e) => {
    toque = true;
    nave.x = e.touches[0].clientX - nave.width / 2;
    nave.y = e.touches[0].clientY - nave.height / 2;
});
canvas.addEventListener('touchmove', (e) => {
    nave.x = e.touches[0].clientX - nave.width / 2;
    nave.y = e.touches[0].clientY - nave.height / 2;
});
canvas.addEventListener('touchend', () => {
    toque = false;
});

// 🔫 Tiros
const tiros = [];
function atirar() {
    tiros.push({
        x: nave.x + nave.width / 2 - 5,
        y: nave.y,
        width: 10,
        height: 20,
        speed: 15
    });
    sons.tiro_nave.currentTime = 0;
    sons.tiro_nave.play();
}
setInterval(atirar, 500);

// 🛸 Inimigos
const inimigos = [];
let fase = 1;
let mortosNaFase = 0;
let limiteInimigos = 15;
let bossApareceu = false;

// ❤️ Vida
let vida = 100;

// 🌌 Fundo
let estrelas = [];
for (let i = 0; i < 100; i++) {
    estrelas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 2 + 1
    });
}

// 🔥 Loop principal
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    estrelas.forEach(estrela => {
        ctx.beginPath();
        ctx.arc(estrela.x, estrela.y, estrela.size, 0, Math.PI * 2);
        ctx.fill();
        estrela.y += estrela.speed;
        if (estrela.y > canvas.height) estrela.y = 0;
    });

    // Nave
    ctx.drawImage(nave.img, nave.x, nave.y, nave.width, nave.height);

    // Tiros
    tiros.forEach((tiro, index) => {
        ctx.drawImage(imagens.tiro_nave, tiro.x, tiro.y, tiro.width, tiro.height);
        tiro.y -= tiro.speed;
        if (tiro.y < 0) tiros.splice(index, 1);
    });

    // Inimigos
    if (!bossApareceu && mortosNaFase < limiteInimigos) {
        if (Math.random() < 0.02) {
            const tipo = Math.floor(Math.random() * 3) + 1;
            inimigos.push({
                x: Math.random() * (canvas.width - 80),
                y: -80,
                width: 80,
                height: 80,
                speed: 3 + fase * 0.3,
                vida: 10 + fase * 2,
                img: imagens[`inimigo${tipo}`]
            });
        }
    }

    if (!bossApareceu && mortosNaFase >= limiteInimigos) {
        bossApareceu = true;
        const bossTipo = Math.floor(Math.random() * 3) + 1;
        inimigos.push({
            x: canvas.width / 2 - 150,
            y: 50,
            width: 300,
            height: 300,
            speed: 2,
            vida: 200 + fase * 20,
            img: imagens[`boss${bossTipo}`],
            boss: true
        });
    }

    inimigos.forEach((inimigo, i) => {
        inimigo.y += inimigo.speed;
        ctx.drawImage(inimigo.img, inimigo.x, inimigo.y, inimigo.width, inimigo.height);

        // Colisão com tiro
        tiros.forEach((tiro, j) => {
            if (
                tiro.x < inimigo.x + inimigo.width &&
                tiro.x + tiro.width > inimigo.x &&
                tiro.y < inimigo.y + inimigo.height &&
                tiro.y + tiro.height > inimigo.y
            ) {
                inimigo.vida -= 10;
                tiros.splice(j, 1);
                if (inimigo.vida <= 0) {
                    sons.explosao.play();
                    inimigos.splice(i, 1);
                    if (!inimigo.boss) mortosNaFase++;
                    else {
                        proximaFase();
                    }
                }
            }
        });

        // Colisão com nave
        if (
            nave.x < inimigo.x + inimigo.width &&
            nave.x + nave.width > inimigo.x &&
            nave.y < inimigo.y + inimigo.height &&
            nave.y + nave.height > inimigo.y
        ) {
            vida -= 20;
            sons.explosao.play();
            inimigos.splice(i, 1);
            if (vida <= 0) gameOver();
        }

        // Se sair da tela
        if (inimigo.y > canvas.height) inimigos.splice(i, 1);
    });

    // HUD
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.fillText(`Fase: ${fase}`, 20, 30);
    ctx.fillText(`Vida: ${vida}`, canvas.width - 120, 30);

    requestAnimationFrame(loop);
}

function proximaFase() {
    fase++;
    mortosNaFase = 0;
    limiteInimigos = Math.floor(limiteInimigos * 1.4);
    bossApareceu = false;
    nave.vida = 100;
    vida = 100;
    if (fase > 21) vitoria();
}

function gameOver() {
    sons.derrota.play();
    fase = 1;
    mortosNaFase = 0;
    limiteInimigos = 15;
    bossApareceu = false;
    inimigos.length = 0;
    tiros.length = 0;
    vida = 100;
}

function vitoria() {
    sons.vitoria.play();
    alert('Você venceu, parabéns!');
    fase = 1;
    mortosNaFase = 0;
    limiteInimigos = 15;
    bossApareceu = false;
    inimigos.length = 0;
    tiros.length = 0;
    vida = 100;
}

loop();