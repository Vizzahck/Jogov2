const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Destravar som no primeiro toque
let somDestravado = false;
canvas.addEventListener('touchstart', () => {
    if (!somDestravado) {
        for (const key in sons) {
            sons[key].play().catch(() => {});
            sons[key].pause();
            sons[key].currentTime = 0;
        }
        somDestravado = true;
    }
});

// Carregar imagens (mantenha as imagens no diretório correto)
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

// Sons
function loadSound(src) {
    const audio = new Audio(src);
    return audio;
}

// Imagens
const imagens = {
    nave: loadImage('assets/imagens/nave1.png'),
    inimigo: loadImage('assets/imagens/inimigo1.png'),
    tiro: loadImage('assets/imagens/tiro_nave.png'),
    tiroInimigo: loadImage('assets/imagens/tiro_inimigo.png'),
    boss: loadImage('assets/imagens/boss1.png'),
    coracao: loadImage('assets/imagens/coracao.png')
};

// Sons
const sons = {
    tiro: loadSound('assets/sounds/tiro_nave.wav'),
    explosao: loadSound('assets/sounds/explosao.wav'),
    derrota: loadSound('assets/sounds/derrota.wav'),
    vitoria: loadSound('assets/sounds/vitoria.wav'),
    tiro_inimigo: loadSound('assets/sounds/tiro_inimigo.wav')
};

// Estrelas do fundo
let estrelas = [];
for (let i = 0; i < 150; i++) {
    estrelas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        tamanho: Math.random() * 2,
        velocidade: Math.random() * 2 + 0.5
    });
}

function desenharEstrelas() {
    ctx.fillStyle = 'white';
    estrelas.forEach(estrela => {
        ctx.beginPath();
        ctx.arc(estrela.x, estrela.y, estrela.tamanho, 0, Math.PI * 2);
        ctx.fill();

        estrela.y += estrela.velocidade;
        if (estrela.y > canvas.height) {
            estrela.y = 0;
            estrela.x = Math.random() * canvas.width;
        }
    });
}

// Jogador
const nave = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 120,
    width: 80,
    height: 80,
    velocidade: 10,
    tiroCooldown: 0
};

// Controles
let toqueX = nave.x + nave.width / 2;

// Evento para movimentar
canvas.addEventListener('touchmove', (e) => {
    const toque = e.touches[0];
    toqueX = toque.clientX;
});

// Listas
let tiros = [];
let inimigos = [];
let tirosInimigos = [];

// HUD
let vida = 3;
let fase = 1;

// Loop principal
function atualizar() {
    desenharEstrelas();

    // Movimentar nave
    if (toqueX < nave.x + nave.width / 2) {
        nave.x -= nave.velocidade;
    } else if (toqueX > nave.x + nave.width / 2) {
        nave.x += nave.velocidade;
    }
    nave.x = Math.max(0, Math.min(canvas.width - nave.width, nave.x));

    // Atirar
    nave.tiroCooldown--;
    if (nave.tiroCooldown <= 0) {
        tiros.push({ x: nave.x + nave.width / 2 - 5, y: nave.y });
        sons.tiro.play();
        nave.tiroCooldown = 15;
    }

    // Atualizar tiros
    tiros.forEach((tiro, index) => {
        tiro.y -= 12;
        if (tiro.y < 0) tiros.splice(index, 1);
    });

    // Gerar inimigos
    if (inimigos.length < 5) {
        inimigos.push({
            x: Math.random() * (canvas.width - 60),
            y: -60,
            vida: 2,
            velocidade: 3
        });
    }

    // Atualizar inimigos
    inimigos.forEach((ini, i) => {
        ini.y += ini.velocidade;

        // Colisão com nave
        if (colide(ini, nave)) {
            vida--;
            inimigos.splice(i, 1);
            sons.explosao.play();
        }

        // Se sair da tela
        if (ini.y > canvas.height) {
            inimigos.splice(i, 1);
        }
    });

    // Atualizar tiros inimigos (inimigos ainda não estão atirando nesta versão simples)

    // Verificar derrota
    if (vida <= 0) {
        vida = 3;
        fase = 1;
        inimigos = [];
        tiros = [];
        sons.derrota.play();
    }

    // Desenhar
    desenhar();

    requestAnimationFrame(atualizar);
}

function desenhar() {
    // Nave
    ctx.drawImage(imagens.nave, nave.x, nave.y, nave.width, nave.height);

    // Tiros
    tiros.forEach(tiro => {
        ctx.drawImage(imagens.tiro, tiro.x, tiro.y, 10, 20);
    });

    // Inimigos
    inimigos.forEach(ini => {
        ctx.drawImage(imagens.inimigo, ini.x, ini.y, 60, 60);
    });

    // HUD tamanho proporcional
    const escala = canvas.width / 800;
    for (let i = 0; i < vida; i++) {
        ctx.drawImage(imagens.coracao, 10 + i * (30 * escala), 10, 25 * escala, 25 * escala);
    }

    ctx.fillStyle = 'white';
    ctx.font = `${24 * escala}px Arial`;
    ctx.fillText(`Fase ${fase}`, canvas.width - 120 * escala, 30 * escala);
}

// Colisão
function colide(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}

atualizar();