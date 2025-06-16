const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Imagens
const img = (src) => {
    const i = new Image();
    i.src = src;
    return i;
};

const imagens = {
    fundo: img('assets/imagens/fundo_estrelado.png'),
    nave: [img('assets/imagens/nave1.png'), img('assets/imagens/nave2.png'), img('assets/imagens/nave3.png')],
    inimigo: [img('assets/imagens/inimigo1.png'), img('assets/imagens/inimigo2.png'), img('assets/imagens/inimigo3.png')],
    boss: [img('assets/imagens/boss1.png'), img('assets/imagens/boss2.png'), img('assets/imagens/boss3.png')],
    tiro_nave: img('assets/imagens/tiro_nave.png'),
    tiro_inimigo: img('assets/imagens/tiro_inimigo.png'),
    coracao: img('assets/imagens/coracao.png'),
    powerup_vida: img('assets/imagens/powerup_vida.png'),
    powerup_tiro: img('assets/imagens/powerup_tiro.png'),
    powerup_escudo: img('assets/imagens/powerup_escudo.png')
};

// Sons
const sons = {
    tiro_nave: new Audio('assets/sounds/tiro_nave.wav'),
    tiro_inimigo: new Audio('assets/sounds/tiro_inimigo.wav'),
    explosao: new Audio('assets/sounds/explosao.wav'),
    powerup: new Audio('assets/sounds/powerup.wav'),
    derrota: new Audio('assets/sounds/derrota.wav'),
    vitoria: new Audio('assets/sounds/vitoria.wav')
};

// Variáveis
let fase = 1;
let vidas = 3;
let score = 0;
let nave;
let inimigos = [];
let tiros = [];
let tirosInimigos = [];
let powerups = [];
let boss = null;
let estrelas = [];
let fim = false;
let mensagemFinal = null;

// Classes
class Estrela {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2;
        this.vel = Math.random() * 1 + 0.5;
    }

    atualizar() {
        this.y += this.vel;
        if (this.y > canvas.height) {
            this.y = 0;
            this.x = Math.random() * canvas.width;
        }
    }

    desenhar() {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Nave {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.width = 60;
        this.height = 60;
        this.sprite = imagens.nave[Math.min(Math.floor(fase / 7), 2)];
        this.tiroCooldown = 0;
    }

    atualizar() {
        this.tiroCooldown--;
    }

    desenhar() {
        ctx.drawImage(this.sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }

    atirar() {
        if (this.tiroCooldown <= 0) {
            tiros.push(new Tiro(this.x, this.y - 30, -10, 'nave'));
            sons.tiro_nave.play();
            this.tiroCooldown = 15;
        }
    }
}

class Inimigo {
    constructor() {
        this.x = Math.random() * (canvas.width - 50) + 25;
        this.y = -50;
        this.width = 50;
        this.height = 50;
        this.sprite = imagens.inimigo[Math.floor(Math.random() * imagens.inimigo.length)];
        this.vida = 1;
        this.tiroCooldown = Math.random() * 100 + 50;
    }

    atualizar() {
        this.y += 2;
        this.tiroCooldown--;
        if (this.tiroCooldown <= 0) {
            tirosInimigos.push(new Tiro(this.x, this.y + 20, 5, 'inimigo'));
            sons.tiro_inimigo.play();
            this.tiroCooldown = Math.random() * 100 + 50;
        }
    }

    desenhar() {
        ctx.drawImage(this.sprite, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}

class Boss extends Inimigo {
    constructor() {
        super();
        this.width = 120;
        this.height = 120;
        this.sprite = imagens.boss[Math.min(Math.floor(fase / 7), 2)];
        this.vida = 10 + Math.floor(fase * 1.5);
    }

    atualizar() {
        this.y += 1.5;
        this.tiroCooldown--;
        if (this.tiroCooldown <= 0) {
            tirosInimigos.push(new Tiro(this.x, this.y + 40, 6, 'inimigo'));
            sons.tiro_inimigo.play();
            this.tiroCooldown = Math.random() * 80 + 40;
        }
    }
}

class Tiro {
    constructor(x, y, vel, dono) {
        this.x = x;
        this.y = y;
        this.vel = vel;
        this.dono = dono;
        this.width = 10;
        this.height = 20;
    }

    atualizar() {
        this.y += this.vel;
    }

    desenhar() {
        const sprite = this.dono === 'nave' ? imagens.tiro_nave : imagens.tiro_inimigo;
        ctx.drawImage(sprite, this.x - 5, this.y - 10, 10, 20);
    }
}

class PowerUp {
    constructor(tipo) {
        this.x = Math.random() * (canvas.width - 50) + 25;
        this.y = -30;
        this.vel = 3;
        this.tipo = tipo;
        this.sprite = imagens[`powerup_${tipo}`];
    }

    atualizar() {
        this.y += this.vel;
    }

    desenhar() {
        ctx.drawImage(this.sprite, this.x - 15, this.y - 15, 30, 30);
    }
}

class MensagemFinal {
    constructor() {
        this.x = canvas.width / 2;
        this.y = -50;
        this.vel = 2;
        this.texto = "Você venceu, parabéns ❤️";
    }

    atualizar() {
        this.y += this.vel;
    }

    desenhar() {
        ctx.font = "40px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(this.texto, this.x, this.y);
    }
}

// Funções
function iniciar() {
    nave = new Nave();
    inimigos = [];
    tiros = [];
    tirosInimigos = [];
    powerups = [];
    boss = null;
    mensagemFinal = null;
    fim = false;

    for (let i = 0; i < 100; i++) {
        estrelas.push(new Estrela());
    }
}

function spawnInimigos() {
    const alvo = Math.floor(15 * Math.pow(1.4, fase - 1));
    if (inimigos.length < alvo) {
        inimigos.push(new Inimigo());
    } else if (!boss) {
        boss = new Boss();
    }
}

function atualizar() {
    if (mensagemFinal) {
        mensagemFinal.atualizar();
        if (mensagemFinal.y > canvas.height + 50) {
            fase = 1;
            vidas = 3;
            iniciar();
        }
        return;
    }

    estrelas.forEach(e => e.atualizar());

    nave.atualizar();

    tiros.forEach(t => t.atualizar());
    tirosInimigos.forEach(t => t.atualizar());
    inimigos.forEach(i => i.atualizar());
    powerups.forEach(p => p.atualizar());
    if (boss) boss.atualizar();

    spawnInimigos();
}

function desenhar() {
    ctx.drawImage(imagens.fundo, 0, 0, canvas.width, canvas.height);

    estrelas.forEach(e => e.desenhar());

    nave.desenhar();
    tiros.forEach(t => t.desenhar());
    tirosInimigos.forEach(t => t.desenhar());
    inimigos.forEach(i => i.desenhar());
    powerups.forEach(p => p.desenhar());
    if (boss) boss.desenhar();

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText(`Fase ${fase}`, 70, 40);

    for (let i = 0; i < vidas; i++) {
        ctx.drawImage(imagens.coracao, 20 + i * 40, 50, 30, 30);
    }

    if (mensagemFinal) {
        mensagemFinal.desenhar();
    }
}

function loop() {
    atualizar();
    desenhar();
    requestAnimationFrame(loop);
}

window.addEventListener('mousemove', e => {
    nave.x = e.clientX;
});

window.addEventListener('touchmove', e => {
    nave.x = e.touches[0].clientX;
});

window.addEventListener('click', () => nave.atirar());
window.addEventListener('touchstart', () => nave.atirar());

iniciar();
loop();