const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Carregar imagens
const imagens = {};
const nomesImagens = [
    'nave1', 'nave2', 'nave3',
    'boss1', 'boss2', 'boss3',
    'coracao', 'inimigo1', 'inimigo2', 'inimigo3',
    'powerup_escudo', 'powerup_tiro', 'powerup_vida',
    'tiro_nave', 'tiro_inimigo'
];
nomesImagens.forEach(nome => {
    const img = new Image();
    img.src = `assets/imagens/${nome}.png`;
    imagens[nome] = img;
});

// Carregar sons
const sons = {
    tiro_nave: new Audio('assets/sounds/tiro_nave.wav'),
    tiro_inimigo: new Audio('assets/sounds/tiro_inimigo.wav'),
    explosao: new Audio('assets/sounds/explosao.wav'),
    powerup: new Audio('assets/sounds/powerup.wav'),
    vitoria: new Audio('assets/sounds/vitoria.wav'),
    derrota: new Audio('assets/sounds/derrota.wav')
};

// Variáveis do jogo
let fase = 1;
let vida = 3;
let inimigos = [];
let tiros = [];
let tirosInimigos = [];
let boss = null;
let estrelas = [];
let inimigosDestruidos = 0;
let jogando = true;
let mostrandoMensagemFinal = false;

// Funções auxiliares
function inimigosNecessarios() {
    return Math.floor(15 * Math.pow(1.4, fase - 1));
}

function bossVida() {
    return 30 + fase * 10;
}

// Criar fundo de estrelas
function criarEstrelas() {
    estrelas = [];
    for (let i = 0; i < 100; i++) {
        estrelas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            tamanho: Math.random() * 2,
            velocidade: 0.5 + Math.random()
        });
    }
}

// Desenhar estrelas
function atualizarEstrelas() {
    estrelas.forEach(e => {
        e.y += e.velocidade;
        if (e.y > canvas.height) {
            e.y = 0;
            e.x = Math.random() * canvas.width;
        }
    });
    estrelas.forEach(e => {
        ctx.fillStyle = 'white';
        ctx.fillRect(e.x, e.y, e.tamanho, e.tamanho);
    });
}

// Nave
const nave = {
    x: canvas.width / 2,
    y: canvas.height - 150,
    largura: 80,
    altura: 80,
    velocidade: 7,
    imagem: imagens['nave1'],
    atualizarImagem() {
        if (fase <= 7) this.imagem = imagens['nave1'];
        else if (fase <= 14) this.imagem = imagens['nave2'];
        else this.imagem = imagens['nave3'];
    },
    desenhar() {
        ctx.drawImage(this.imagem, this.x, this.y, this.largura, this.altura);
    }
};

// Controles
window.addEventListener('mousemove', e => {
    nave.x = e.clientX - nave.largura / 2;
    nave.y = e.clientY - nave.altura / 2;
});

// Tiro da nave
function atirar() {
    tiros.push({
        x: nave.x + nave.largura / 2 - 5,
        y: nave.y,
        largura: 10,
        altura: 20,
        velocidade: 10
    });
    sons.tiro_nave.play();
}

// Criar inimigos
function criarInimigo() {
    const tipos = ['inimigo1', 'inimigo2', 'inimigo3'];
    const tipo = tipos[Math.floor(Math.random() * tipos.length)];
    inimigos.push({
        x: Math.random() * (canvas.width - 60),
        y: -60,
        largura: 60,
        altura: 60,
        velocidade: 2 + fase * 0.2,
        vida: Math.floor(3 + fase * 0.5),
        tipo: tipo,
        tiroTimer: Math.random() * 100
    });
}

// Criar boss
function criarBoss() {
    const tipo = fase <= 7 ? 'boss1' : fase <= 14 ? 'boss2' : 'boss3';
    boss = {
        x: canvas.width / 2 - 100,
        y: -200,
        largura: 200,
        altura: 200,
        velocidade: 2 + fase * 0.3,
        vida: bossVida(),
        tipo: tipo,
        tiros: 0
    };
}

// Movimentação e ataque do boss
function atualizarBoss() {
    if (!boss) return;
    boss.y += boss.velocidade * 0.3;
    if (boss.y > 100) boss.y = 100;
    boss.x += Math.sin(Date.now() * 0.002) * boss.velocidade * 3;

    // Atirar múltiplos tiros
    if (boss.tiros % 20 === 0) {
        for (let i = -1; i <= 1; i++) {
            tirosInimigos.push({
                x: boss.x + boss.largura / 2 + i * 30,
                y: boss.y + boss.altura,
                velocidade: 5,
                super: false
            });
        }
        sons.tiro_inimigo.play();
    }

    if (fase === 21 && boss.tiros % 10 === 0) {
        // Super raio
        tirosInimigos.push({
            x: boss.x + boss.largura / 2 - 2,
            y: boss.y + boss.altura,
            velocidade: 10,
            super: true
        });
    }
    boss.tiros++;
}

// Atualizar inimigos
function atualizarInimigos() {
    inimigos.forEach(inimigo => {
        inimigo.y += inimigo.velocidade;
        inimigo.x += Math.sin(Date.now() * 0.003 + inimigo.y * 0.01) * 2;

        inimigo.tiroTimer--;
        if (inimigo.tiroTimer <= 0) {
            tirosInimigos.push({
                x: inimigo.x + inimigo.largura / 2 - 5,
                y: inimigo.y + inimigo.altura,
                velocidade: 5,
                super: false
            });
            sons.tiro_inimigo.play();
            inimigo.tiroTimer = 100 + Math.random() * 100;
        }
    });
}

// Checar colisões
function colisao(a, b) {
    return (
        a.x < b.x + b.largura &&
        a.x + a.largura > b.x &&
        a.y < b.y + b.altura &&
        a.y + a.altura > b.y
    );
}

// Atualizar e desenhar tudo
function atualizar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    atualizarEstrelas();

    nave.atualizarImagem();
    nave.desenhar();

    // Tiros da nave
    tiros.forEach(t => {
        t.y -= t.velocidade;
        ctx.drawImage(imagens['tiro_nave'], t.x, t.y, t.largura, t.altura);
    });
    tiros = tiros.filter(t => t.y > 0);

    // Inimigos
    atualizarInimigos();
    inimigos.forEach(inimigo => {
        ctx.drawImage(imagens[inimigo.tipo], inimigo.x, inimigo.y, inimigo.largura, inimigo.altura);

        // Colisão inimigo x nave
        if (colisao(inimigo, nave)) {
            vida--;
            inimigos.splice(inimigos.indexOf(inimigo), 1);
            sons.explosao.play();
            if (vida <= 0) {
                reiniciarFase();
                return;
            }
        }
    });

    // Boss
    atualizarBoss();
    if (boss) {
        ctx.drawImage(imagens[boss.tipo], boss.x, boss.y, boss.largura, boss.altura);
    }

    // Tiros inimigos
    tirosInimigos.forEach(t => {
        t.y += t.velocidade;
        ctx.drawImage(imagens['tiro_inimigo'], t.x, t.y, 10, t.super ? 50 : 20);

        if (colisao(t, nave)) {
            vida--;
            tirosInimigos.splice(tirosInimigos.indexOf(t), 1);
            sons.explosao.play();
            if (vida <= 0) {
                reiniciarFase();
                return;
            }
        }
    });

    // Interface
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.fillText(`Fase: ${fase}`, 20, 40);
    ctx.fillText('❤️'.repeat(vida), 20, 80);

    requestAnimationFrame(atualizar);
}

// Reiniciar fase
function reiniciarFase() {
    vida = 3;
    inimigos = [];
    tiros = [];
    tirosInimigos = [];
    boss = null;
    inimigosDestruidos = 0;
}

// Inicializar jogo
function iniciarJogo() {
    criarEstrelas();
    setInterval(() => {
        if (!boss && inimigosDestruidos < inimigosNecessarios()) {
            criarInimigo();
        } else if (!boss && inimigosDestruidos >= inimigosNecessarios()) {
            criarBoss();
        }
    }, 800);

    setInterval(atirar, 500);
    atualizar();
}

iniciarJogo();