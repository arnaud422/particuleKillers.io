const canvas = document.querySelector('canvas')
const ctx = canvas.getContext('2d')
const startGame = document.getElementById('start')
let score = document.getElementById('score')
let bigScore = document.getElementById('bigScore')
let startContainer = document.querySelector('.start-container')

const windowWith = innerWidth //largeur de l'écran
const windowHeight = innerHeight //hauteur de l'écran

//redéfinir la longeur du canvas
canvas.width = windowWith
canvas.height = windowHeight

//centre x et y
const centerX = windowWith / 2
const centerY = windowHeight / 2

const friction = 0.98

//class qui correspond a une particule (pour le joueur, les projectils, les ennemis)
class Skin {
    #score = 0

    set #myScore(i) {
        this.#score += i
    }
    get #myScore() {
        return this.#score
    }
    constructor(size, color, x, y) {
        this.x = x !== undefined ? x : this.x
        this.y = y !== undefined ? y : this.y
        this.size = size
        this.color = color
        this.alpha = 1
    }
    //dessiner le skin
    draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.beginPath()
        ctx.arc(
            this.x,
            this.y,
            this.size,
            0,
            Math.PI * 2,
            false
        )
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.restore()
    }

    attack() {
        this.#myScore = 10
    }

    scoreReturn() {
        return this.#myScore
    }
}
//définition par défaut de de et y (au center)
Skin.prototype.x = centerX
Skin.prototype.y = centerY

//création d'un projectil
class Projectile extends Skin {
    constructor(x, y, size, color, velocity) {
        super(size, color)
        this.x = x
        this.y = y
        this.velocity = velocity
    }

    update() {
        this.draw()
        this.x = this.x + this.velocity.x
        this.y = this.y + this.velocity.y
    }
}
//class qui correspond aux ennemis
class Ennemy extends Projectile {
    constructor(x, y, size, color, velocity) {
        super(x, y, size, color, velocity)
    }
}

Game = (function (){
    let projectiles = [] // tableau qui contient les projectiles
    let enemies = [] // tableau qui contient les ennemies
    let bonus = [] // tableau qui contient les bonus de kill
    let isstart = false

    let animationId
    function animate() {
        animationId = requestAnimationFrame(animate)
        ctx.fillStyle = 'rgba(0,0,0,0.070)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        player.draw() // dessiner le joueur

        projectiles.forEach((projectile, index) => {
            projectile.update() // mise a jour des projectiles

            //retirer les projectile hors de l'écran
            if (projectile.x - projectile.size < 0 ||
                projectile.x + projectile.size > canvas.width ||
                projectile.y - projectile.size < 0 ||
                projectile.y + projectile.size > canvas.height) {
                setTimeout(() => {
                    projectiles.splice(index, 1)
                }, 0)
            }
        })

        bonus.forEach((particule, index) => {
            particule.update()
            particule.velocity.x *= friction
            particule.velocity.y *= friction
            if (particule.alpha - 0.1 <= 0) {
                bonus.splice(index, 1)
            }
            particule.alpha -= 0.01
        });

        enemies.forEach((enemie, indexE) => {
            enemie.update()

            const dist = Math.hypot(player.x - enemie.x, player.y - enemie.y)
            if (dist <= enemie.size + player.size - 1) {
                setTimeout(() => {
                    cancelAnimationFrame(animationId)
                    isstart = !isstart
                    bigScore.innerText = player.scoreReturn()
                    startContainer.style.display = 'flex';
                }, 0)
            }

            projectiles.forEach((projectile, indexP) => {

                //calcule de collision et vérifier si il y a collision
                const dist = Math.hypot(projectile.x - enemie.x, projectile.y - enemie.y)
                if (dist <= enemie.size + projectile.size - 1) {
                    player.attack()
                    score.innerText = player.scoreReturn()
                    if (enemie.size - 10 > 10) {
                        enemie.size -= 10
                        //create bonus explosion
                        for (let i = 0; i < Math.random() * 5 + 5; i++) {
                            bonus.push(new Projectile(enemie.x, enemie.y, Math.random() * 3 + 1, enemie.color, { x: (Math.random() - 0.5) * 5, y: (Math.random() - 0.5) * 5 }))
                        }

                        setTimeout(() => {
                            projectiles.splice(indexP, 1)
                        }, 0)
                        enemie.color = `hsl(${Math.random() * 360}, 70%, 50%)`
                    } else {
                        setTimeout(() => {
                            enemies.splice(indexE, 1)
                            projectiles.splice(indexP, 1)
                        }, 0)
                    }
                }
            });
        })
    }
    //cration de projectile au click
    window.addEventListener('click', (event) => {
        // récupére l'angle(rad) du click par rapport au centre 
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) //(event.clientY - centerY, event.clientX - centerX) => permet d'avoir la distance d'un click y et x par rapport au centre comme point 0

        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        }
        projectiles.push(new Projectile(centerX, centerY, 5, "#FFF", velocity))
    })


    function spawnEnemies() {
        setInterval(() => {
            if(isstart){
                size = Math.random() * 40 + 5
                x = Math.random() < 0.5 ? Math.random() * canvas.width / 3 : (Math.random() * canvas.width / 3) + (canvas.width / 3) * 2
                y = Math.random() < 0.5 ? Math.random() * canvas.height / 3 : (Math.random() * canvas.height / 3) + (canvas.height / 3) * 2
                color = `hsl(${Math.random() * 360}, 70%, 50%)`

                const angle = Math.atan2(centerY - y, centerX - x)
                const speed = Math.random() < 0.5 ? 2 : 3
                const velocity = { x: Math.cos(angle) * speed, y:  Math.sin(angle) * speed }
                enemies.push(new Ennemy(x, y, size, color, velocity))
            }
        }, (Math.random() * 200) + 800)
    }

    function __init__(){
        projectiles = []
        enemies = []
        bonus = []
        score.innerText = 0

        player = new Skin(10, "#FFF")
        isstart = !isstart
    }

    function start() {
        __init__()
        animate()
        startContainer.style.display = 'none';
    }

    startGame.addEventListener('click', ()=>{
        start()
    })
    spawnEnemies()
})()