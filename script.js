const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const hudFase = document.getElementById('fase');
const hudVida = document.getElementById('vida');
const finalScreen = document.getElementById('final');

let fase = 1;
let vida = 3;
let pontos = 0;
let inimigosDerrotados = 0;
let inimigosNecessarios = 15;
let nave;
let tiros = [];
let inimigos = [];
let tirosInimigos = [];
let powerUps = [];
let boss = null;
let gameOver = false;
let jogoFinalizado = false;

// Sons
const somTiro = new Audio('assets/sounds/tiro_nave.wav');
const somExplosao = new Audio('assets/sounds/explosao.wav');
const somDerrota = new Audio('assets/sounds/derrota.wav');
const somVitoria = new Audio('assets/sounds/vitoria.wav');
const somPowerup = new Audio('assets/sounds/powerup.wav');
const somTiroInimigo = new Audio('assets/sounds/tiro_inimigo.wav');

// Carregar imagens
const imagens = {
    nave: ['nave1.png', 'nave2.png', 'nave3.png'].map(img => carregarImagem(`assets/imagens/${img}`)),
    inimigos: ['inimigo1.png', 'inimigo2.png', 'inimigo3.png'].map(img => carregarImagem(`assets/imagens/${img}`)),
    boss: ['boss1.png', 'boss2.png', 'boss3.png'].map(img => carregarImagem(`assets/imagens/${img}`)),
    coracao: carregarImagem('assets/imagens/coracao.png'),
    fundo: carregarImagem('assets/imagens/fundo_estrelado.png'),
    powerups: {
        vida: carregarImagem('assets/imagens/powerup_vida.png'),
        escudo: carregarImagem('assets/imagens/powerup_escudo.png'),
        tiro: carregarImagem('assets/imagens/powerup_tiro.png'),
    },
    tiros: {
        nave: carregarImagem('assets/imagens/tiro_nave.png'),
        inimigo: carregarImagem('assets/imagens/tiro_inimigo.png'),
    }
};

function carregarImagem(src) {
    const img = new Image();
    img.src = src;
    return img;
}

class Nave {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.largura = 80;
        this.altura = 80;
        this.velocidade = 10;
        this.sprite = imagens.nave[Math.min(2, Math.floor((fase - 1) / 7))];
    }

    desenhar() {
        ctx.drawImage(this.sprite, this.x - this.largura / 2, this.y - this.altura / 2, this.largura, this.altura);
    }

    mover(x) {
        this.x = Math.max(this.largura/2, Math.min(canvas.width - this.largura/2, x));
    }
}

function spawnInimigo() {
    const x = Math.random() * (canvas.width - 50) + 25;
    const y = -50;
    inimigos.push({
        x,
        y,
        largura: 60,
        altura: 60,
        vida: 1 + Math.floor(fase/3),
        sprite: imagens.inimigos[Math.floor(Math.random()*imagens.inimigos.length)],
    });
}

function spawnBoss() {
    const x = canvas.width / 2;
    const y = 100;
    boss = {
        x,
        y,
        largura: 120,
        altura: 120,
        vida: 20 + fase * 5,
        sprite: imagens.boss[Math.floor(Math.random()*imagens.boss.length)],
    };
}

function desenharFundo() {
    ctx.drawImage(imagens.fundo, 0, 0, canvas.width, canvas.height);
}

function desenharVida() {
    hudVida.innerHTML = '❤️'.repeat(vida);
}

function desenharFase() {
    hudFase.innerHTML = `Fase ${fase}`;
}

function atualizar() {
    if (jogoFinalizado) return;

    desenharFundo();
    nave.desenhar();
    desenharVida();
    desenharFase();

    tiros.forEach((t, i) => {
        t.y -= t.vel;
        ctx.drawImage(imagens.tiros.nave, t.x - 10, t.y - 20, 20, 40);
        if (t.y < 0) tiros.splice(i,1);
    });

    inimigos.forEach((ini, i) => {
        ini.y += 2;
        ctx.drawImage(ini.sprite, ini.x - ini.largura/2, ini.y - ini.altura/2, ini.largura, ini.altura);
        if (ini.y > canvas.height) {
            inimigos.splice(i,1);
            vida--;
            if (vida <= 0) perder();
        }
    });

    if (boss) {
        ctx.drawImage(boss.sprite, boss.x - boss.largura/2, boss.y - boss.altura/2, boss.largura, boss.altura);
    }

    requestAnimationFrame(atualizar);
}

function perder() {
    somDerrota.play();
    gameOver = true;
    vida = 3;
    resetarFase();
}

function resetarFase() {
    inimigos = [];
    tiros = [];
    tirosInimigos = [];
    powerUps = [];
    boss = null;
    inimigosDerrotados = 0;
    inimigosNecessarios = Math.floor(15 * Math.pow(1.4, fase-1));
    gameOver = false;
    iniciar();
}

function iniciar() {
    nave = new Nave();
    desenharFase();
    desenharVida();
    finalScreen.classList.add('hidden');

    const spawnLoop = setInterval(() => {
        if (inimigosDerrotados >= inimigosNecessarios && !boss) {
            spawnBoss();
            clearInterval(spawnLoop);
        } else if (!boss) {
            spawnInimigo();
        }
    }, 800);

    atualizar();
}

function proximaFase() {
    fase++;
    if (fase > 21) {
        jogoFinalizado = true;
        somVitoria.play();
        finalScreen.classList.remove('hidden');
        return;
    }
    vida = 3;
    resetarFase();
}

window.addEventListener('mousemove', (e) => {
    nave.mover(e.clientX);
});

window.addEventListener('click', () => {
    tiros.push({x: nave.x, y: nave.y - 40, vel: 10});
    somTiro.play();
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    nave.mover(e.touches[0].clientX);
}, {passive:false});

window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    tiros.push({x: nave.x, y: nave.y - 40, vel: 10});
    somTiro.play();
}, {passive:false});

iniciar();