const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 800;

// Elementos DOM
const vidaNave = document.getElementById('vidaNave');
const faseDiv = document.getElementById('fase');
const finalDiv = document.getElementById('final');
const mensagemFinal = document.getElementById('mensagemFinal');

// Sons
const sons = {
    tiroNave: new Audio('./assets/sounds/tiro_nave.wav'),
    tiroInimigo: new Audio('./assets/sounds/tiro_inimigo.wav'),
    explosao: new Audio('./assets/sounds/explosao.wav'),
    powerup: new Audio('./assets/sounds/powerup.wav'),
    derrota: new Audio('./assets/sounds/derrota.wav'),
    vitoria: new Audio('./assets/sounds/vitoria.wav')
};

// Imagens
const imagens = {
    fundo: './assets/imagens/fundo_estrelado.png',
    nave: ['./assets/imagens/nave1.png', './assets/imagens/nave2.png', './assets/imagens/nave3.png'],
    inimigos: ['./assets/imagens/inimigo1.png', './assets/imagens/inimigo2.png', './assets/imagens/inimigo3.png'],
    bosses: ['./assets/imagens/boss1.png', './assets/imagens/boss2.png', './assets/imagens/boss3.png'],
    tiroNave: './assets/imagens/tiro_nave.png',
    tiroInimigo: './assets/imagens/tiro_inimigo.png',
    coracao: './assets/imagens/coracao.png',
    powerupVida: './assets/imagens/powerup_vida.png',
    powerupTiro: './assets/imagens/powerup_tiro.png',
    powerupEscudo: './assets/imagens/powerup_escudo.png'
};

// Variáveis do jogo
let nave, tiros, tirosInimigos, inimigos, boss, estrelas, powerups;
let fase = 1;
let vida = 5;
let jogoFinalizado = false;
let inimigosMortos = 0;
let bossDerrotado = false;

// Funções utilitárias
function carregarImagem(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Objetos
class Nave {
    constructor() {
        this.imagem = carregarImagem(imagens.nave[Math.min(Math.floor((fase - 1) / 7), 2)]);
        this.x = canvas.width / 2 - 32;
        this.y = canvas.height - 100;
        this.largura = 64;
        this.altura = 64;
        this.vel = 7;
    }

    desenhar() {
        ctx.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
    }

    mover(touchX) {
        this.x = touchX - this.largura / 2;
        if (this.x < 0) this.x = 0;
        if (this.x + this.largura > canvas.width) this.x = canvas.width - this.largura;
    }

    atirar() {
        tiros.push(new Tiro(this.x + this.largura / 2 - 5, this.y - 10));
        sons.tiroNave.play();
    }
}

class Tiro {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.largura = 10;
        this.altura = 20;
        this.vel = 10;
        this.img = carregarImagem(imagens.tiroNave);
    }

    atualizar() {
        this.y -= this.vel;
    }

    desenhar() {
        ctx.drawImage(this.img, this.x, this.y, this.largura, this.altura);
    }
}

class Inimigo {
    constructor() {
        const imgIndex = Math.floor(Math.random() * imagens.inimigos.length);
        this.imagem = carregarImagem(imagens.inimigos[imgIndex]);
        this.x = Math.random() * (canvas.width - 50);
        this.y = -50;
        this.largura = 50;
        this.altura = 50;
        this.vel = 2 + fase * 0.3;
        this.tiroCooldown = 60;
    }

    atualizar() {
        this.y += this.vel;
        this.tiroCooldown--;
        if (this.tiroCooldown <= 0) {
            tirosInimigos.push(new TiroInimigo(this.x + this.largura / 2, this.y + this.altura));
            sons.tiroInimigo.play();
            this.tiroCooldown = 60;
        }
    }

    desenhar() {
        ctx.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
    }
}

class TiroInimigo {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.largura = 10;
        this.altura = 20;
        this.vel = 6;
        this.img = carregarImagem(imagens.tiroInimigo);
    }

    atualizar() {
        this.y += this.vel;
    }

    desenhar() {
        ctx.drawImage(this.img, this.x, this.y, this.largura, this.altura);
    }
}

class Boss {
    constructor() {
        const imgIndex = Math.min(Math.floor((fase - 1) / 7), 2);
        this.imagem = carregarImagem(imagens.bosses[imgIndex]);
        this.x = canvas.width / 2 - 100;
        this.y = -200;
        this.largura = 200;
        this.altura = 200;
        this.vel = 1.5;
        this.vida = 30 + fase * 10;
        this.tiroCooldown = 30;
    }

    atualizar() {
        if (this.y < 50) {
            this.y += this.vel;
        }
        this.tiroCooldown--;
        if (this.tiroCooldown <= 0) {
            tirosInimigos.push(new TiroInimigo(this.x + this.largura / 2, this.y + this.altura));
            sons.tiroInimigo.play();
            this.tiroCooldown = 30;
        }
    }

    desenhar() {
        ctx.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
    }
}

// PowerUp (não detalhei aqui para não estender, mas pode ser incluído igual aos anteriores)

// Estrelas de fundo
function criarEstrelas() {
    const estrelas = [];
    for (let i = 0; i < 100; i++) {
        estrelas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            tamanho: Math.random() * 2 + 1,
            vel: Math.random() * 1 + 0.5
        });
    }
    return estrelas;
}

// Controle de Fase
function reiniciarFase() {
    nave = new Nave();
    tiros = [];
    tirosInimigos = [];
    inimigos = [];
    boss = null;
    estrelas = criarEstrelas();
    powerups = [];
    vida = 5;
    jogoFinalizado = false;
    bossDerrotado = false;
    inimigosMortos = 0;
    faseDiv.innerText = `Fase ${fase}`;
    finalDiv.classList.add('hidden');
    mensagemFinal.innerHTML = '';
}

// Loop Principal
function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fundo
    estrelas.forEach(estrela => {
        estrela.y += estrela.vel;
        if (estrela.y > canvas.height) estrela.y = 0;
        ctx.fillStyle = 'white';
        ctx.fillRect(estrela.x, estrela.y, estrela.tamanho, estrela.tamanho);
    });

    // Desenha nave
    nave.desenhar();

    // Atualiza e desenha tiros
    tiros.forEach(t => {
        t.atualizar();
        t.desenhar();
    });

    // Atualiza e desenha tiros inimigos
    tirosInimigos.forEach(t => {
        t.atualizar();
        t.desenhar();
    });

    // Gerenciamento de inimigos
    if (inimigos.length < Math.min(15 + fase * 0.4, 50) && !boss) {
        inimigos.push(new Inimigo());
    }

    inimigos.forEach(inimigo => {
        inimigo.atualizar();
        inimigo.desenhar();
    });

    // Boss
    if (inimigosMortos >= 15 + fase * 0.4 && !boss) {
        boss = new Boss();
    }
    if (boss) {
        boss.atualizar();
        boss.desenhar();
    }

    // HUD
    vidaNave.innerText = '❤️'.repeat(vida);

    if (!jogoFinalizado) requestAnimationFrame(loop);
}

// Finalizar jogo
function finalizarJogo() {
    if (jogoFinalizado) return;
    jogoFinalizado = true;
    setTimeout(() => {
        finalDiv.classList.remove('hidden');
        mensagemFinal.innerHTML = `
        Viu amor, as vezes nosso relacionamento vai ser como esse jogo...<br>
        Vai ter fases difíceis, mas se não desistirmos...<br>
        Seguiremos juntos até o final. ❤️`;
        sons.vitoria.play();
    }, 1000);
}

// Iniciar Jogo
reiniciarFase();
loop();