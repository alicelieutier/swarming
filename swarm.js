/* global Plotly*/
const NUMBER_OF_BOIDS = 1000;
const RADIUS_OF_NEIGHBOURHOOD = 200;
const SEPARATION = 40;
const MAX_X = 800;
const MAX_Y = 800;
const MAX_VELOCITY = 70; 

const Boid = (x, y, vx, vy) => ({x, y, vx, vy})

const rand = n => (Math.random()* n)
const abs = x => x > 0 ? x : -x

const areNeighbours = (b1, b2, radius) => ((b1.x - b2.x )**2 + (b1.y - b2.y)**2 <=  radius**2)
const getNeighbours = (boid, boids, radius = RADIUS_OF_NEIGHBOURHOOD) => boids.filter(b => boid !== b  && areNeighbours(boid, b, radius))

const createInitialBoidArray = (nbOfBoids) => {
    let boids = [];
    for (let index = 0; index < nbOfBoids; index++) {
        const boid = Boid(
            rand(MAX_X),
            rand(MAX_Y),
            rand(MAX_VELOCITY*2) - MAX_VELOCITY,
            rand(MAX_VELOCITY*2) - MAX_VELOCITY,
        );
        boids.push(boid);
    }
    return boids 
}

const displayBoids = (htmlElement, boidArray) => {    
    let coords_x = boidArray.map( (boid) => boid.x );
    let coords_y = boidArray.map( (boid) => boid.y ) ;
    Plotly.newPlot(htmlElement, [{x:coords_x, y:coords_y, mode: 'markers', type:'scatter'}])
}

const average = (points) => {
    const sum_x = points.reduce((acc, point) => acc + point.x, 0)
    const sum_y = points.reduce((acc, point) => acc + point.y, 0)
    const sum_vx = points.reduce((acc, point) => acc + point.vx, 0)
    const sum_vy = points.reduce((acc, point) => acc + point.vy, 0)
    const length = points.length
    return {
        x: sum_x / length,
        y: sum_y / length,
        vx: sum_vx / length,
        vy: sum_vy / length,

    }
}

const cohesion = (boid, neighbours) => {
    const target = average(neighbours)
    const xToTarget = target.x - boid.x
    const yToTarget = target.y - boid.y
    const distanceToTarget = Math.sqrt(xToTarget**2 + yToTarget**2)
    const vx = (abs(distanceToTarget) < MAX_VELOCITY ) ? xToTarget : xToTarget * MAX_VELOCITY / distanceToTarget
    const vy = (abs(distanceToTarget) < MAX_VELOCITY ) ? yToTarget : yToTarget * MAX_VELOCITY / distanceToTarget
    return {vx, vy}
}

const alignment = (boid, neighbours) => {
    const neighbourhood = average(neighbours)
    return {
        vx: neighbourhood.vx,
        vy: neighbourhood.vy
    }
}

const separation = (boid, neighbours) => {
    let {vx, vy} = boid
    const tooClose = getNeighbours(boid, neighbours, SEPARATION)
    if (tooClose.length === 0) {
        return {vx, vy}
    }
    const distancesToClosests = tooClose.map( (close) => ({x: close.x - boid.x, y: close.y - boid.y}))
    return {
        vx: - distancesToClosests.reduce((acc, distance) => acc + distance.x, 0),
        vy: - distancesToClosests.reduce((acc, distance) => acc + distance.y, 0),
    }
}


const moveOne = (boid, boids)=> {
    const neighbours = getNeighbours(boid, boids)
    let {x, y, vx, vy} = boid
    if (neighbours.length === 0) {
        return Boid(x + vx, y + vy, vx, vy)
    }
    const cohere = cohesion(boid, neighbours)
    const align = alignment(boid, neighbours)
    const separate = separation(boid, neighbours)

    vx = (vx + cohere.vx + align.vx + separate.vx ) / 4
    vy = (vy + cohere.vy + align.vy + separate.vy ) / 4

    return Boid( x + vx, y + vy, vx, vy)
}

const normalize = ({x, y, vx, vy}) => ({
    x: (x + MAX_X) % MAX_X,
    y: (y + MAX_Y) % MAX_Y,
    vx,
    vy
})

const oneTick = boids => boids.map(boid => normalize(moveOne(boid, boids)))

const go = () => {
    let boids = createInitialBoidArray(NUMBER_OF_BOIDS)
    const plot_div = document.getElementById('plot')
    displayBoids(plot_div, boids)
    const step = () => {
        boids = oneTick(boids);
        displayBoids(plot_div, boids);
        window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
}

go()
