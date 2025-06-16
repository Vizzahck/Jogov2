// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// HUD
const faseDiv = document.getElementById('fase');
const vidaDiv = document.getElementById('vidaNave');
const finalDiv = document.getElementById('final');
const mensagemFinal = document.getElementById('mensagemFinal');

// Sons
const somTiro = new Audio('./assets/sounds/tiro_nave.wav');
const somExplosao = new Audio('./assets/sounds/explosao.wav');
const somPowerup = new Audio('./assets/sounds/powerup.wav');
const somVitoria = new Audio('./assets/sounds/vitoria.wav');
const somDerrota = new Audio('./assets/sounds/derrota.wav');

// Imagens
const imagens = {
    fundo: carregarImagem('fundo_estrelado'),
    coracao: carregarImagem('coracao'),
    nave: [
        carregarImagem('nave1'),
        carregarImagem('nave2'),
        carregarImagem('nave3')
    ],
    inimigos: [
        carregarImagem('inimigo1'),
        carregarImagem('inimigo2'),
        carregarImagem('inimigo3')
    ],
    boss: [
        carregarImagem('boss1'),
        carregarImagem('boss2'),
        carregarImagem('boss3')
    ],
    tiros: carregarImagem('tiro_nave'),
    tirosInimigo: carregarImagem('tiro_inimigo'),
    powerups: {
        vida: carregarImagem('powerup_vida'),
        escudo: carregarImagem('powerup_escudo'),
        tiro: carregarImagem('powerup_tiro')
    }
};

function carregarImagem(nome) {
    const img = new Image();
    img.src = `./assets/imagens/${nome}.png`;
    return img;
}

// Responsivo
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Variáveis
let fase = 1;
let nave = criarNave();
let tiros = [];
let tirosInimigos = [];
let inimigos = [];
let boss = null;
let estrelas = criarEstrelas();
let powerups = [];
let mortos = 0;
let jogoFinalizado = false;
let tempoDisparo = 0;

// Criar nave
function criarNave() {
    return {
        x: canvas.width / 2,
        y: canvas.height - 150,
        w: 70,
        h: 70,
        vida: 5,
        escudo: false,
        skin: 0
    };
}

// Estrelas
function criarEstrelas() {
    return Array.from({length: 100}, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 1,
        velocidade: Math.random() * 1 + 0.5
    }));
}

// Controles
function moverNave(e) {
    const toque = e.touches ? e.touches[0] : e;
    const rect = canvas.getBoundingClientRect();
    nave.x = toque.clientX - rect.left;
    nave.y = toque.clientY - rect.top;
}
canvas.addEventListener('touchmove', moverNave);
canvas.addEventListener('mousemove', moverNave);

// Spawn de inimigos progressivo
function spawnInimigo() {
    const vel = 2 + fase * 0.3;
    inimigos.push({
        x: Math.random() * (canvas.width - 50),
        y: -50,
        w: 50,
        h: 50,
        vida: 1 + Math.floor(fase / 5),
        velocidade: vel,
        skin: Math.floor(Math.random() * imagens.inimigos.length)
    });
}

// Boss
function spawnBoss() {
    boss = {
        x: canvas.width / 2 - 75,
        y: 50,
        w: 150,
        h: 150,
        vida: 10 + fase * 3,
        dir: 1,
        skin: (fase - 1) % imagens.boss.length
    };
}

// Powerups
function spawnPowerup(x, y) {
    const tipos = ['vida', 'escudo', 'tiro'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    powerups.push({x, y, w: 30, h: 30, tipo});
}

// Fundo com estrelas
function desenharFundo() {
    ctx.drawImage(imagens.fundo, 0, 0, canvas.width, canvas.height);
    estrelas.forEach(e => {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
        e.y += e.velocidade;
        if (e.y > canvas.height) {
            e.y = 0;
            e.x = Math.random() * canvas.width;
        }
    });
}

// Desenhar
function desenhar() {
    desenharFundo();
    ctx.drawImage(imagens.nave[nave.skin], nave.x - nave.w/2, nave.y - nave.h/2, nave.w, nave.h);

    tiros.forEach(t => ctx.drawImage(imagens.tiros, t.x - 5, t.y - 10, 10, 20));
    tirosInimigos.forEach(t => ctx.drawImage(imagens.tirosInimigo, t.x - 5, t.y - 10, 10, 20));

    inimigos.forEach(i => {
        const img = imagens.inimigos[i.skin];
        ctx.drawImage(img, i.x, i.y, i.w, i.h);
    });

    powerups.forEach(p => {
        ctx.drawImage(imagens.powerups[p.tipo], p.x, p.y, p.w, p.h);
    });

    if (boss) {
        const img = imagens.boss[boss.skin];
        ctx.drawImage(img, boss.x, boss.y, boss.w, boss.h);
        ctx.fillStyle = 'red';
        ctx.fillRect(boss.x, boss.y - 10, boss.w * (boss.vida / (10 + fase * 3)), 5);
    }
}

// Atualizar
function atualizar() {
    if (jogoFinalizado) return;

    tempoDisparo++;
    if (tempoDisparo > 15) {
        tiros.push({x: nave.x, y: nave.y - nave.h/2});
        somTiro.play();
        tempoDisparo = 0;
    }

    tiros.forEach(t => t.y -= 8);
    tiros = tiros.filter(t => t.y > -20);

    tirosInimigos.forEach(t => t.y += 5);
    tirosInimigos = tirosInimigos.filter(t => t.y < canvas.height + 20);

    inimigos.forEach(i => {
        i.y += i.velocidade;
        if (Math.random() < 0.015) {
            tirosInimigos.push({x: i.x + i.w/2, y: i.y + i.h});
            somTiro.play();
        }
    });

    inimigos = inimigos.filter(i => i.y < canvas.height + 50 && i.vida > 0);

    if (boss) {
        boss.x += boss.dir * 3;
        if (boss.x <= 0 || boss.x + boss.w >= canvas.width) boss.dir *= -1;
        if (Math.random() < 0.02) {
            tirosInimigos.push({x: boss.x + boss.w/2, y: boss.y + boss.h});
            somTiro.play();
        }
    }

    powerups.forEach(p => p.y += 3);
    powerups = powerups.filter(p => p.y < canvas.height + 30);

    // Colisões
    tiros.forEach(t => {
        inimigos.forEach(i => {
            if (t.x > i.x && t.x < i.x + i.w && t.y > i.y && t.y < i.y + i.h) {
                i.vida--;
                t.y = -999;
                if (i.vida <= 0) {
                    mortos++;
                    somExplosao.play();
                    if (Math.random() < 0.2) spawnPowerup(i.x, i.y);
                }
            }
        });

        if (boss && t.x > boss.x && t.x < boss.x + boss.w && t.y > boss.y && t.y < boss.y + boss.h) {
            boss.vida--;
            t.y = -999;
            if (boss.vida <= 0) {
                somExplosao.play();
            }
        }
    });

    tirosInimigos.forEach(t => {
        if (t.x > nave.x - nave.w/2 && t.x < nave.x + nave.w/2 &&
            t.y > nave.y - nave.h/2 && t.y < nave.y + nave.h/2) {
            if (!nave.escudo) nave.vida--;
            t.y = canvas.height + 999;
        }
    });

    powerups.forEach(p => {
        if (p.x < nave.x + nave.w/2 && p.x + p.w > nave.x - nave.w/2 &&
            p.y < nave.y + nave.h/2 && p.y + p.h > nave.y - nave.h/2) {
            somPowerup.play();
            if (p.tipo === 'vida') nave.vida++;
            if (p.tipo === 'escudo') nave.escudo = true;
            if (p.tipo === 'tiro') tempoDisparo = 5;
            p.y = canvas.height + 999;
        }
    });

    // Derrota
    if (nave.vida <= 0) {
        somDerrota.play();
        reiniciarFase();
        return;
    }

    // Vitória da fase
    if (boss && boss.vida <= 0) {
        boss = null;
        if (fase >= 21) {
            somVitoria.play();
            jogoFinalizado = true;
            finalDiv.classList.remove('hidden');
            mensagemFinal.innerHTML = `
                A nossa relação é como esse jogo...<br>
                Vão ter fases difíceis, isso faz parte...<br>
                Mas ainda assim, é só não desistir.<br><br>
                Eu te amo ❤️
            `;
        } else {
            fase++;
            prepararFase();
        }
    }

    if (!boss && mortos >= Math.floor(15 + fase * 0.4)) {
        spawnBoss();
    }

    if (!boss && mortos < Math.floor(15 + fase * 0.4) && Math.random() < 0.02) {
        spawnInimigo();
    }
}

// Preparar fase
function prepararFase() {
    nave.vida = 5;
    nave.escudo = false;
    nave.skin = Math.min(2, Math.floor(fase / 7));
    tiros = [];
    tirosInimigos = [];
    inimigos = [];
    powerups = [];
    boss = null;
    mortos = 0;
}

// Reiniciar fase atual
function reiniciarFase() {
    prepararFase();
}

// Loop
function loop() {
    atualizar();
    desenhar();
    faseDiv.innerText = 'Fase ' + fase;
    vidaDiv.innerText = '❤️'.repeat(nave.vida) + (nave.escudo ? '🛡️' : '');
    requestAnimationFrame(loop);
}

// Inicializar
prepararFase();
loop();
