const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let fase = 1;
let vida = 3;
let pontos = 0;
let inimigosMortos = 0;
let inimigosPorFase = 15;
let bossAparece = false;
let jogoAtivo = true;

const hudFase = document.getElementById('fase');
const hudVida = document.getElementById('vida');
const telaFinal = document.getElementById('final');

// Imagens
const imagens = {};
const nomesImagens = ['nave1','nave2','nave3','boss1','boss2','boss3','coracao','fundo_estrelado','inimigo1','inimigo2','inimigo3','powerup_escudo','powerup_tiro','powerup_vida','tiro_nave','tiro_inimigo'];

nomesImagens.forEach(nome => {
    const img = new Image();
    img.src = `assets/imagens/${nome}.png`;
    imagens[nome] = img;
});

// Sons
const sons = {};
const nomesSons = ['derrota','explosao','powerup','tiro_inimigo','tiro_nave','vitoria'];

nomesSons.forEach(nome => {
    const audio = new Audio(`assets/sounds/${nome}.wav`);
    sons[nome] = audio;
});

// Estrelas (fundo animado)
const estrelas = [];
for(let i=0;i<100;i++){
    estrelas.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vel:1+Math.random()*2});
}

// Jogador
let nave = {
    x: canvas.width/2,
    y: canvas.height-100,
    w: 60,
    h: 60,
    imagem: imagens.nave1,
    tiroCooldown: 0
};

function atualizarNave(){
    if(fase>=15) nave.imagem = imagens.nave3;
    else if(fase>=7) nave.imagem = imagens.nave2;
    else nave.imagem = imagens.nave1;
}

let tiros = [];
let inimigos = [];
let tirosInimigos = [];
let powerups = [];
let boss = null;

// Controles
let tocando = false;
canvas.addEventListener('touchstart',e=>{
    tocando = true;
    nave.x = e.touches[0].clientX;
});
canvas.addEventListener('touchmove',e=>{
    if(tocando) nave.x = e.touches[0].clientX;
});
canvas.addEventListener('touchend',()=>{tocando=false;});

// Loop principal
function loop(){
    if(!jogoAtivo) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Fundo
    ctx.drawImage(imagens.fundo_estrelado,0,0,canvas.width,canvas.height);
    estrelas.forEach(e=>{
        ctx.fillStyle = 'white';
        ctx.fillRect(e.x,e.y,2,2);
        e.y += e.vel;
        if(e.y > canvas.height) e.y = 0;
    });

    // Nave
    ctx.drawImage(nave.imagem,nave.x-nave.w/2,nave.y-nave.h/2,nave.w,nave.h);
    if(nave.tiroCooldown<=0){
        tiros.push({x:nave.x,y:nave.y-30,w:10,h:20});
        sons.tiro_nave.play();
        nave.tiroCooldown=15;
    }else{
        nave.tiroCooldown--;
    }

    // Tiros
    tiros.forEach((t,i)=>{
        t.y -= 10;
        ctx.drawImage(imagens.tiro_nave,t.x-5,t.y,10,20);
        if(t.y<0) tiros.splice(i,1);
    });

    // Inimigos
    if(!bossAparece){
        if(inimigos.length<5){
            const tipo = Math.ceil(Math.random()*3);
            inimigos.push({
                x:Math.random()*(canvas.width-60)+30,
                y:-60,
                w:50,
                h:50,
                vida:1+Math.floor(fase/5),
                img:imagens[`inimigo${tipo}`]
            });
        }
    }

    inimigos.forEach((inimigo,ii)=>{
        inimigo.y += 3;
        ctx.drawImage(inimigo.img,inimigo.x-inimigo.w/2,inimigo.y-inimigo.h/2,inimigo.w,inimigo.h);

        // Tiro inimigo
        if(Math.random()<0.01){
            tirosInimigos.push({x:inimigo.x,y:inimigo.y+20,w:10,h:20});
            sons.tiro_inimigo.play();
        }

        // Colisão com tiro
        tiros.forEach((t,j)=>{
            if(Math.abs(t.x-inimigo.x)<25 && Math.abs(t.y-inimigo.y)<25){
                inimigo.vida--;
                tiros.splice(j,1);
                if(inimigo.vida<=0){
                    inimigos.splice(ii,1);
                    sons.explosao.play();
                    inimigosMortos++;
                    if(inimigosMortos>=inimigosPorFase){
                        bossAparece=true;
                        spawnBoss();
                    }
                }
            }
        });

        // Colisão com nave
        if(Math.abs(nave.x-inimigo.x)<30 && Math.abs(nave.y-inimigo.y)<30){
            perderVida();
            inimigos.splice(ii,1);
        }

    });

    // Boss
    if(boss){
        boss.y += 2;
        ctx.drawImage(boss.img,boss.x-boss.w/2,boss.y-boss.h/2,boss.w,boss.h);

        if(Math.random()<0.02){
            tirosInimigos.push({x:boss.x,y:boss.y+30,w:10,h:20});
            sons.tiro_inimigo.play();
        }

        tiros.forEach((t,j)=>{
            if(Math.abs(t.x-boss.x)<40 && Math.abs(t.y-boss.y)<40){
                boss.vida--;
                tiros.splice(j,1);
                if(boss.vida<=0){
                    sons.explosao.play();
                    boss = null;
                    proximaFase();
                }
            }
        });

        if(Math.abs(nave.x-boss.x)<40 && Math.abs(nave.y-boss.y)<40){
            perderVida();
        }
    }

    // Tiros inimigos
    tirosInimigos.forEach((t,i)=>{
        t.y += 7;
        ctx.drawImage(imagens.tiro_inimigo,t.x-5,t.y,10,20);
        if(t.y>canvas.height) tirosInimigos.splice(i,1);

        if(Math.abs(t.x-nave.x)<20 && Math.abs(t.y-nave.y)<20){
            perderVida();
            tirosInimigos.splice(i,1);
        }
    });

    // PowerUps (A implementar nas próximas se quiser)

    // HUD
    hudFase.innerText = `Fase: ${fase}`;
    hudVida.innerText = "❤️".repeat(vida);

    requestAnimationFrame(loop);
}

function perderVida(){
    vida--;
    sons.derrota.play();
    if(vida<=0){
        reiniciarFase();
    }
}

function reiniciarFase(){
    vida=3;
    inimigos=[];
    tiros=[];
    tirosInimigos=[];
    boss=null;
    inimigosMortos=0;
    bossAparece=false;
}

function proximaFase(){
    fase++;
    atualizarNave();
    inimigos=[];
    tiros=[];
    tirosInimigos=[];
    boss=null;
    inimigosMortos=0;
    bossAparece=false;
    inimigosPorFase = Math.floor(15 + (fase-1)*0.4*15);

    if(fase>21){
        telaFinal.classList.remove('oculto');
        sons.vitoria.play();
        jogoAtivo=false;
    }
}

function spawnBoss(){
    const tipo = fase%3===0 ? 3 : fase%2===0 ? 2 : 1;
    boss = {
        x:canvas.width/2,
        y:-150,
        w:150,
        h:150,
        vida:10+Math.floor(fase*1.5),
        img:imagens[`boss${tipo}`]
    };
}

atualizarNave();
loop();