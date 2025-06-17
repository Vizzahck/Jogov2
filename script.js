const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Carregamento de imagens
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const imagens = {
    fundo: loadImage(''),
    nave: [loadImage('assets/imagens/nave1.png'), loadImage('assets/imagens/nave2.png'), loadImage('assets/imagens/nave3.png')],
    inimigos: [loadImage('assets/imagens/inimigo1.png'), loadImage('assets/imagens/inimigo2.png'), loadImage('assets/imagens/inimigo3.png')],
    boss: [loadImage('assets/imagens/boss1.png'), loadImage('assets/imagens/boss2.png'), loadImage('assets/imagens/boss3.png')],
    coracao: loadImage('assets/imagens/coracao.png'),
    tiro_nave: loadImage('assets/imagens/tiro_nave.png'),
    tiro_inimigo: loadImage('assets/imagens/tiro_inimigo.png'),
    powerups: [
        loadImage('assets/imagens/powerup_vida.png'),
        loadImage('assets/imagens/powerup_tiro.png'),
        loadImage('assets/imagens/powerup_escudo.png')
    ]
};

// Sons
function loadSound(src) {
    const audio = new Audio(src);
    return audio;
}

const sons = {
    tiro_nave: loadSound('assets/sounds/tiro_nave.wav'),
    tiro_inimigo: loadSound('assets/sounds/tiro_inimigo.wav'),
    explosao: loadSound('assets/sounds/explosao.wav'),
    powerup: loadSound('assets/sounds/powerup.wav'),
    vitoria: loadSound('assets/sounds/vitoria.wav'),
    derrota: loadSound('assets/sounds/derrota.wav')
};

// Efeito de estrelas
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

// Variáveis principais do jogo
let fase = 1;
let vida = 3;
let pontos = 0;
let inimigos = [];
let tiros = [];
let tirosInimigos = [];
let powerups = [];
let boss = null;
let derrotouBoss = false;
let inimigosMortos = 0;
let jogoRodando = true;

// Jogador
const nave = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 120,
    width: 80,
    height: 80,
    velocidade: 8,
    atirarCooldown: 0
};

// Controles de toque
let toqueX = canvas.width / 2;

// Eventos
canvas.addEventListener('touchmove', (e) => {
    const toque = e.touches[0];
    toqueX = toque.clientX;
});

// Lógica dos inimigos
function gerarInimigos() {
    if (boss || inimigos.length >= 5) return;
    const inimigo = {
        x: Math.random() * (canvas.width - 60),
        y: -60,
        width: 60,
        height: 60,
        vida: 2 + fase,
        velocidade: 2 + fase * 0.2,
        imagem: imagens.inimigos[Math.floor(Math.random() * imagens.inimigos.length)],
        atirarCooldown: Math.random() * 100 + 50
    };
    inimigos.push(inimigo);
}

// Boss
function gerarBoss() {
    boss = {
        x: canvas.width / 2 - 120,
        y: 50,
        width: 240,
        height: 240,
        vida: 50 + fase * 10,
        velocidade: 2 + fase * 0.5,
        imagem: imagens.boss[(fase - 1) % imagens.boss.length],
        direcaoX: 1,
        direcaoY: 1,
        tiroCooldown: 60,
        superRaioCooldown: 600
    };
}

// Power-ups
function gerarPowerup(x, y) {
    const tipo = Math.floor(Math.random() * imagens.powerups.length);
    powerups.push({
        x,
        y,
        width: 40,
        height: 40,
        tipo,
        imagem: imagens.powerups[tipo]
    });
}

// Tiro do jogador
function atirar() {
    if (nave.atirarCooldown <= 0) {
        sons.tiro_nave.play();
        tiros.push({
            x: nave.x + nave.width / 2 - 5,
            y: nave.y,
            width: 10,
            height: 20
        });
        nave.atirarCooldown = 20;
    }
}

// Loop principal
function atualizar() {
    if (!jogoRodando) return;

    // Estrelas
    desenharEstrelas();

    // Movimentação da nave
    if (toqueX < nave.x + nave.width / 2) {
        nave.x -= nave.velocidade;
    } else if (toqueX > nave.x + nave.width / 2) {
        nave.x += nave.velocidade;
    }
    nave.x = Math.max(0, Math.min(canvas.width - nave.width, nave.x));

    // Atirar
    nave.atirarCooldown--;
    atirar();

    // Tiros do jogador
    tiros.forEach((tiro, index) => {
        tiro.y -= 10;
        if (tiro.y < 0) tiros.splice(index, 1);
    });

    // Inimigos
    if (inimigosMortos < 15 + Math.floor(fase * 0.4)) {
        gerarInimigos();
    } else if (!boss) {
        gerarBoss();
    }

    inimigos.forEach((ini, i) => {
        ini.y += ini.velocidade;
        ini.atirarCooldown--;
        if (ini.atirarCooldown <= 0) {
            tirosInimigos.push({
                x: ini.x + ini.width / 2 - 5,
                y: ini.y + ini.height,
                width: 10,
                height: 20
            });
            sons.tiro_inimigo.play();
            ini.atirarCooldown = Math.random() * 100 + 50;
        }

        // Colisão com nave
        if (colide(ini, nave)) {
            vida--;
            sons.explosao.play();
            inimigos.splice(i, 1);
        }

        if (ini.y > canvas.height) {
            inimigos.splice(i, 1);
        }
    });

    // Tiros inimigos
    tirosInimigos.forEach((tiro, i) => {
        tiro.y += 7;
        if (colide(tiro, nave)) {
            vida--;
            tirosInimigos.splice(i, 1);
            sons.explosao.play();
        } else if (tiro.y > canvas.height) {
            tirosInimigos.splice(i, 1);
        }
    });

    // Boss
    if (boss) {
        boss.x += boss.direcaoX * boss.velocidade;
        boss.y += boss.direcaoY * boss.velocidade * 0.5;

        if (boss.x <= 0 || boss.x + boss.width >= canvas.width) boss.direcaoX *= -1;
        if (boss.y <= 0 || boss.y + boss.height >= canvas.height / 2) boss.direcaoY *= -1;

        boss.tiroCooldown--;
        if (boss.tiroCooldown <= 0) {
            for (let j = -1; j <= 1; j++) {
                tirosInimigos.push({
                    x: boss.x + boss.width / 2 + j * 20,
                    y: boss.y + boss.height,
                    width: 10,
                    height: 20
                });
            }
            sons.tiro_inimigo.play();
            boss.tiroCooldown = 60;
        }

        boss.superRaioCooldown--;
        if (boss.superRaioCooldown <= 0) {
            for (let k = 0; k < 5; k++) {
                tirosInimigos.push({
                    x: boss.x + (k * boss.width / 5),
                    y: boss.y + boss.height,
                    width: 10,
                    height: 40
                });
            }
            boss.superRaioCooldown = 600;
        }
    }

    // Verificar vida da nave
    if (vida <= 0) {
        sons.derrota.play();
        reiniciarFase();
    }

    // Verificar vitória da fase
    if (boss && boss.vida <= 0) {
        boss = null;
        inimigos = [];
        tiros = [];
        tirosInimigos = [];
        powerups = [];
        inimigosMortos = 0;
        derrotouBoss = true;
        fase++;
        if (fase > 21) {
            mostrarMensagemFinal();
        }
    }

    desenhar();
    requestAnimationFrame(atualizar);
}

// Desenhar elementos
function desenhar() {
    // Fundo já desenhado pelas estrelas

    // Nave
    ctx.drawImage(imagens.nave[(fase - 1) % imagens.nave.length], nave.x, nave.y, nave.width, nave.height);

    // Tiros
    tiros.forEach(tiro => {
        ctx.drawImage(imagens.tiro_nave, tiro.x, tiro.y, tiro.width, tiro.height);
    });

    // Inimigos
    inimigos.forEach(ini => {
        ctx.drawImage(ini.imagem, ini.x, ini.y, ini.width, ini.height);
    });

    // Boss
    if (boss) {
        ctx.drawImage(boss.imagem, boss.x, boss.y, boss.width, boss.height);
    }

    // Tiros inimigos
    tirosInimigos.forEach(tiro => {
        ctx.drawImage(imagens.tiro_inimigo, tiro.x, tiro.y, tiro.width, tiro.height);
    });

    // Power-ups
    powerups.forEach(pw => {
        ctx.drawImage(pw.imagem, pw.x, pw.y, pw.width, pw.height);
    });

    // HUD
    for (let i = 0; i < vida; i++) {
        ctx.drawImage(imagens.coracao, 10 + i * 40, 10, 30, 30);
    }
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`Fase ${fase}`, canvas.width - 120, 40);
}

// Colisão
function colide(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Reiniciar fase
function reiniciarFase() {
    vida = 3;
    inimigos = [];
    tiros = [];
    tirosInimigos = [];
    powerups = [];
    boss = null;
    inimigosMortos = 0;
}

// Mensagem final
function mostrarMensagemFinal() {
    sons.vitoria.play();
    const msg = {
        x: canvas.width / 2 - 150,
        y: -100,
        width: 300,
        height: 100,
        texto: 'Você venceu, parabéns!'
    };

    function animarMensagem() {
        desenharEstrelas();
        msg.y += 4;
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.fillText(msg.texto, msg.x, msg.y);

        if (msg.y < canvas.height / 2) {
            requestAnimationFrame(animarMensagem);
        } else {
            setTimeout(() => {
                fase = 1;
                vida = 3;
                inimigos = [];
                tiros = [];
                tirosInimigos = [];
                powerups = [];
                boss = null;
                inimigosMortos = 0;
                atualizar();
            }, 3000);
        }
    }
    animarMensagem();
}

atualizar();