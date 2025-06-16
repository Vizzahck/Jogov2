const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let fase = 1;
let vida = 5;
let pontuacao = 0;
let inimigosDerrotados = 0;
let inimigosNecessarios = 15;
let jogoFinalizado = false;

const nave = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 150,
    width: 80,
    height: 80,
    velocidade: 7,
    imagem: carregarImagem('nave1.png'),
    vida: 5
};

const tiros = [];
const tirosInimigos = [];
const inimigos = [];
const powerups = [];
let boss = null;
let estrelas = gerarEstrelas(100);

// Sons
const somTiro = carregarSom('tiro_nave.wav');
const somTiroInimigo = carregarSom('tiro_inimigo.wav');
const somExplosao = carregarSom('explosao.wav');
const somPowerup = carregarSom('powerup.wav');
const somDerrota = carregarSom('derrota.wav');
const somVitoria = carregarSom('vitoria.wav');

// Funções utilitárias
function carregarImagem(nome) {
    const img = new Image();
    img.src = `./assets/imagens/${nome}`;
    return img;
}

function carregarSom(nome) {
    const audio = new Audio(`./assets/sounds/${nome}`);
    return audio;
}

function gerarEstrelas(qtd) {
    const estrelas = [];
    for (let i = 0; i < qtd; i++) {
        estrelas.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            raio: Math.random() * 2,
            velocidade: Math.random() * 1 + 0.5
        });
    }
    return estrelas;
}

function atualizarEstrelas() {
    estrelas.forEach(e => {
        e.y += e.velocidade;
        if (e.y > canvas.height) {
            e.y = 0;
            e.x = Math.random() * canvas.width;
        }
    });
}

function desenharEstrelas() {
    ctx.fillStyle = 'white';
    estrelas.forEach(e => {
