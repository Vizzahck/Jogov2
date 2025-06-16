// Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// HUD
const faseDiv = document.getElementById('fase');
const vidaDiv = document.getElementById('vidaNave');
const finalDiv = document.getElementById('final');
const mensagemFinal = document.getElementById('mensagemFinal');

// Ajuste de tamanho
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// Imagens
const imagens = {
    naves: ['nave1.png', 'nave2.png', 'nave3.png'].map(n => carregarImagem(n)),
    inimigos: ['inimigo1.png', 'inimigo2.png', 'inimigo3.png'].map(n => carregarImagem(n)),
    bosses: ['boss1.png', 'boss2.png', 'boss3.png'].map(n => carregarImagem(n)),
    tiroNave: carregarImagem('tiro_nave.png'),
    tiroInimigo: carregarImagem('tiro_inimigo.png'),
    fundo: carregarImagem('fundo_estrelado.png'),
    coracao: carregarImagem('coracao.png'),
    powerups: {
        vida: carregarImagem('powerup_vida.png'),
        tiro: carregarImagem('powerup_tiro.png'),
        escudo: carregarImagem('powerup_escudo.png')
    }
};

function carregarImagem(nome) {
    const img = new Image();
    img.src = `./assets/imagens/${nome}`;
    return img;
}

// Sons
const sons = {
    tiroNave: carregarSom('tiro_nave.wav'),
    tiroInimigo: carregarSom('tiro_inimigo.wav'),
    explosao: carregarSom('explosao.wav'),
    powerup: carregarSom('powerup.wav'),
    vitoria: carregarSom('vitoria.wav'),
    derrota: carregarSom('derrota.wav')
};

function carregarSom(nome) {
    const audio = new Audio(`./assets/sounds/${nome}`);
    return audio;
}

// Variáveis do jogo
let fase = 1;
let nave = criarNave();
let inimigos = [];
let tiros = [];
let tirosInimigos = [];
let powerups = [];
let boss = null;
let mortosNaFase = 0;
let jogoFinalizado = false;
let tempoDisparo = 0;

// Nave
function criarNave() {
    return {
        x: canvas.width / 2,
        y: canvas.height - 150,
        w: 70,
        h: 70,
        vida: 5,
        naveImg: imagens.naves[0],
        nivel: 0
    };
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

// Funções principais
function spawnInimigo() {
    const img = imagens.inimigos[Math.floor(Math.random() * imagens.inimigos.length)];
    inimigos.push({
        x: Math.random() * (canvas.width - 50),
        y: -50,
        w: 50,
        h: 50,
        vida: 1 + fase * 0.2,
        velocidade: 2 + fase * 0.3,
        img: img
    });
}

function spawnBoss() {
    const img = imagens.bosses[Math.floor(Math.random() * imagens.bosses.length)];
    boss = {
        x: canvas.width / 2 - 75,
        y: 50,
        w: 150,
        h: 150,
        vida: 10 + fase * 3,
        dir: 1,
        img: img
    };
}

function desenharFundo() {
    ctx.drawImage(imagens.fundo, 0, 0, canvas.width, canvas.height);
}

function desenhar() {
    desenharFundo();

    ctx.drawImage(nave.naveImg, nave.x - nave.w/2, nave.y - nave.h/2, nave.w, nave.h);

    tiros.forEach(t => ctx.drawImage(imagens.tiroNave, t.x - 5, t.y - 10, 10, 20));
    inimigos.forEach(i => ctx.drawImage(i.img, i.x, i.y, i.w, i.h));
    tirosInimigos.forEach(t => ctx.drawImage(imagens.tiroInimigo, t.x - 5, t.y - 10, 10, 20));
    powerups.forEach(p => ctx.drawImage(p.img, p.x, p.y, 30, 30));

    if (boss) {
        ctx.drawImage(boss.img, boss.x, boss.y, boss.w, boss.h);
        ctx.fillStyle = 'red';
        ctx.fillRect(boss.x, boss.y - 10, boss.w * (boss.vida / (10 + fase * 3)), 5);
    }
}

function atualizar() {
    if (jogoFinalizado) return;

    tempoDisparo++;
    if (tempoDisparo > 15) {
        tiros.push({x: nave.x, y: nave.y - nave.h/2});
        sons.tiroNave.play();
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
            sons.tiroInimigo.play();
        }
    });

    inimigos = inimigos.filter(i => i.y < canvas.height + 50 && i.vida > 0);

    if (boss) {
        boss.x += boss.dir * 3;
        if (boss.x <= 0 || boss.x + boss.w >= canvas.width) boss.dir *= -1;

        if (Math.random() < 0.02) {
            tirosInimigos.push({x: boss.x + boss.w/2, y: boss.y + boss.h});
            sons.tiroInimigo.play();
        }
    }

    // Colisão tiros
    tiros.forEach(t => {
        inimigos.forEach(i => {
            if (colide(t, i)) {
                i.vida--;
                t.y = -999;
                if (i.vida <= 0) {
                    mortosNaFase++;
                    sons.explosao.play();
                    dropPowerup(i.x, i.y);
                }
            }
        });
        if (boss && colide(t, boss)) {
            boss.vida--;
            t.y = -999;
            sons.explosao.play();
        }
    });

    // Colisão tiros inimigos
    tirosInimigos.forEach(t => {
        if (colide(t, nave)) {
            nave.vida--;
            t.y = canvas.height + 999;
            sons.explosao.play();
        }
    });

    // Powerups
    powerups.forEach(p => {
        p.y += 3;
        if (colide(p, nave)) {
            aplicarPowerup(p.tipo);
            p.y = canvas.height + 999;
            sons.powerup.play();
        }
    });
    powerups = powerups.filter(p => p.y < canvas.height + 30);

    // Derrota
    if (nave.vida <= 0) {
        reiniciarFase();
        sons.derrota.play();
        return;
    }

    // Vitória da fase
    if (boss && boss.vida <= 0) {
        boss = null;
        if (fase >= 21) {
            finalizarJogo();
            return;
        } else {
            fase++;
            mortosNaFase = 0;
            nave.vida = 5;
        }
    }

    // Spawns
    if (!boss) {
        if (mortosNaFase >= Math.floor(10 + fase * 0.4 * 10)) {
            spawnBoss();
        } else if (Math.random() < 0.02) {
            spawnInimigo();
        }
    }
}

function colide(a, b) {
    return (
        a.x > b.x &&
        a.x < b.x + b.w &&
        a.y > b.y &&
        a.y < b.y + b.h
    );
}

function dropPowerup(x, y) {
    if (Math.random() < 0.2) {
        const tipos = ['vida', 'tiro', 'escudo'];
        const tipo = tipos[Math.floor(Math.random() * tipos.length)];
        powerups.push({x, y, tipo, img: imagens.powerups[tipo]});
    }
}

function aplicarPowerup(tipo) {
    if (tipo === 'vida') nave.vida = Math.min(nave.vida + 1, 5);
    if (tipo === 'escudo') nave.vida = Math.min(nave.vida + 2, 5);
    if (tipo === 'tiro') tempoDisparo = Math.max(tempoDisparo - 5, 0);
}

function reiniciarFase() {
    nave = criarNave();
    mortosNaFase = 0;
    inimigos = [];
    tiros = [];
    tirosInimigos = [];
    powerups = [];
    boss = null;
}

function finalizarJogo() {
    jogoFinalizado = true;
    finalDiv.classList.remove('hidden');
    mensagemFinal.innerHTML = `
    A nossa relação é como esse jogo...<br>
    Vão ter fases difíceis, isso faz parte...<br>
    Mas ainda assim, é só não desistir.<br><br>
    Eu te amo ❤️`;
    sons.vitoria.play();
}

function loop() {
    atualizar();
    desenhar();
    faseDiv.innerText = 'Fase ' + fase;
    vidaDiv.innerText = '❤️'.repeat(nave.vida);
    requestAnimationFrame(loop);
}

// Inicializar jogo
reiniciarFase();
loop();