
utils.setup()
utils.setStyles()
utils.setGlobals()

var fov = 60
var camera = {pos: {x: -4, y: 0.5, z: 0}, rot: {x: 0, y: 0, z: 0, w: 0}, quat: [0, 0, 0, 1], useQuat: true}
var vel = {x: 0, y: 0, z: 0}

var invertQuat = qc.rotateAxis([0, 0, 0, 1], [1, 0, 0], Math.PI)

var shadowCamera = {pos: {x: 0, y: 1, z: 0}, rot: {x: 0, y: 0, z: 0}}
var shadowOptions = {distance: 10, fov: 60, grid: 5, size: 20}

function getViewMatrix() {
    let view = mat4.create()
    let projection = mat4.create()
    mat4.perspective(projection, fov * Math.PI / 180, gpucanvas.width / gpucanvas.height, 0.01, 5000)

    mat4.translate(view, view, [camera.pos.x, camera.pos.y, -camera.pos.z])
    mat4.rotateX(view, view, -camera.rot.x)
    mat4.rotateY(view, view, -camera.rot.y)
   
    mat4.rotateZ(view, view, -camera.rot.z)
    mat4.invert(view, view)

    return [projection, view]
}

function getModelMatrix(x, y, z, rotx, roty, rotz, scalex, scaley, scalez, rotw=0) {
    let model = mat4.create()

    mat4.translate(model, model, [x, y, -z])
    mat4.rotateY(model, model, -roty)
    mat4.rotateX(model, model, -rotx)
    mat4.rotateZ(model, model, -rotz)
    

    mat4.rotateZ(model, model, -rotw)
    

    mat4.scale(model, model, [scalex, scaley, -scalez])

    // mat4.invert(model, model)

    return model
}

function nVec(vec) {
    let length = 0
    for (let value of vec) {
        length += value**2
    }
    length = Math.sqrt(length)
    if (length > 0) {
        for (let i in vec) {
            vec[i] /= length
        }
    } else {
        vec[0] = 1
    }
    
    return vec
}

function getModelMatrixQ(x, y, z, quat, sx, sy, sz) {
    let model = mat4.create()

    // let result = quat.create()

    // quat.multiply(result, [rx, ry, rz, rw], [-rx, -ry, -rz, rw])

    mat4.fromRotationTranslation(model, nVec(quat), [x, y, -z])
    mat4.scale(model, model, [sx, sy, -sz])

    return model
}

function getNormalMatrix(rotx, roty, rotz, scalex, scaley, scalez) {
    let model = mat4.create()

    mat4.rotateY(model, model, -roty)
    mat4.rotateX(model, model, -rotx)
    mat4.rotateZ(model, model, -rotz)

    mat4.scale(model, model, [scalex, scaley, scalez])

    let normalMatrix = mat4.create()
    mat4.invert(normalMatrix, model)
    mat4.transpose(normalMatrix, normalMatrix)
    
    return model
}

function getNormalMatrixQ(quat, sx, sy, sz) {
    let model = mat4.create()

    mat4.fromQuat(model, quat)

    mat4.scale(model, model, [sx, sy, sz])

    let normalMatrix = mat4.create()
    mat4.invert(normalMatrix, model)
    mat4.transpose(normalMatrix, normalMatrix)

    return model
}

webgpu.onReady = () => {requestAnimationFrame(frame)}

webgpu.setup()
webgpu.setStyles()


var ground = new webgpu.Box(0, -0.05 - 0.4, 0, 20, 0.1, 20, [1, 1, 1, 1])
ground.oneSide = true

var delta = 0
var lastTime = 0
var su = 0

var time = 0

var speed = 1/3000

var viewProjection

var cpuTimes = []
var gpuTimes = []

var lightDir = {x: 0.85, y: -1, z: 0.5}
let lightLength = Math.sqrt(lightDir.x**2 + lightDir.y**2 + lightDir.z**2)
lightDir = {
    x: lightDir.x/lightLength,
    y: lightDir.y/lightLength,
    z: lightDir.z/lightLength
}

var fps = 0
var fps2 = 0

var player = new Player(0, 0.5, 0)

let path = [
    [0, 5, 10],
    [0, 15, 10],
    [10, 15, 10],
    [10, 5, 10],
    [10, -5, 10],
    [0, -5, 10]
]

for (let pos of path) {
    let point = new webgpu.Box(pos[0], pos[1], pos[2], 1, 1, 1, [1, 0, 0, 1])
    point.collisions = false
}

let blocks = [
    [10, 2.5, 2.5, 10, 5, 0.5],

    [20, 2.5, -2.5, 10, 5, 0.5],

    [30, 5, 2.5, 5, 10, 0.5],
    [32.5, 15, 0, 0.5, 10, 5],
    [30, 25, -2.5, 5, 10, 0.5],

    [10, 30, 2.5, 10, 5, 0.5],

    [20, 30, -2.5, 10, 5, 0.5],

    [-10, 2.5, 0, 0.5, 5, 5, true],
    [-30, 2.5, 10, 0.5, 5, 5, true],
    [-50, 2.5, -10, 0.5, 5, 5, true],
    [-60, 2.5, -20, 5, 5, 0.5, true],
    [-50, 2.5, -30, 0.5, 5, 5, true],
    [-30, 2.5, -20, 0.5, 5, 5, true],

    [-20, 20, -10, 5, 0.5, 5, true],

    [-20, 30, -10, 5, 0.5, 5, true],
]

for (let block of blocks) {
    let blockM = new webgpu.Box(block[0], block[1], block[2], block[3], block[4], block[5], [1, 1, 1, 1])
    if (block[6]) {
        blockM.collisions = false
        blockM.nearCollisions = true
        blockM.colour = [0, 1, 0, 0.5]
        blockM.transparent = true
    }
}

var sendDT = 0

var accumulator = 0
var accumulatorI = 0

var gKeys = {}
var gJKeys = {}
var gMouse = {}
var cJKeys = {}
var cMouse = {}
var iTicked = false

function gameTick() {
    player.turn(mouseMoved.x * sensitivity, mouseMoved.y * sensitivity)

    player.tick()
    
    if (iTicked) {
        cJKeys = {}
        cMouse.lclick = false
        cMouse.rclick = false
        gJKeys = {}
        gMouse.lclick = false
        gMouse.rclick = false

        mouseMoved = {x: 0, y: 0}
        mouseMoving = {x: 0, y: 0}

        iTicked = false
    }

    for (let player in players) {
        players[player].lpos = {...players[player].pos}
        players[player].lquat = [...players[player].quat]
        players[player].visualTick2()
    }
}

let tickrate = 100
let tdelta = 1/tickrate

webgpu.depthLayers = 2
// webgpu.lights.push({pos: [0, 0, 0], colour: [0.8*1.5, 0.8*1.5, 1*1.5], range: 0.5})

function frame(timestamp) {
    let start = performance.now()
    fps++

    utils.getDelta(timestamp)
    ui.resizeCanvas()
    ui.getSu()
    input.setGlobals()

    time = Date.now() / 1000

    webgpu.resizeCanvas()

    // let timewarp = keys["KeyT"]

    if (wConnect && !document.hidden) {
        connectToServer()
        wConnect = false
    }

    [cJKeys, cMouse] = utils.collectInputs(cJKeys, cMouse)
    // console.log(utils.collectInputs(cJKeys, cMouse))

    accumulatorI = utils.constantTick(60, () => {
        [gKeys, gJKeys, gMouse] = utils.inputTick(cJKeys, cMouse); 
        mouseMoved.x = mouseMoving.x
        mouseMoved.y = mouseMoving.y
        iTicked = true
    }, accumulatorI)
    accumulator = utils.constantTick(tickrate, gameTick, accumulator)

    player.visualTick()

    for (let player in playerData) {
        if (id != player && !(player in players)) {
            players[player] = new Player(0, 0, 0)
            players[player].local = false
            players[player].testBox.visible = false
            players[player].lx = 0
            players[player].ly = 0
            players[player].lz = 0
            players[player].lqx = 0
            players[player].lqy = 0
            players[player].lqz = 0
            players[player].lqw = 0
            players[player].lastu = time
        }
    }

    for (let player in players) {
        if (id == player || !(player in playerData)) {
            players[player].delete()
            delete players[player]
        } else {
            players[player].pos.x = lerp(players[player].lx, playerData[player].x, (time-players[player].lastu)*10)
            players[player].pos.y = lerp(players[player].ly, playerData[player].y, (time-players[player].lastu)*10)
            players[player].pos.z = lerp(players[player].lz, playerData[player].z, (time-players[player].lastu)*10)

            players[player].quat[0] = lerp(players[player].lqx, playerData[player].qx, (time-players[player].lastu)*10)
            players[player].quat[1] = lerp(players[player].lqy, playerData[player].qy, (time-players[player].lastu)*10)
            players[player].quat[2] = lerp(players[player].lqz, playerData[player].qz, (time-players[player].lastu)*10)
            players[player].quat[3] = lerp(players[player].lqw, playerData[player].qw, (time-players[player].lastu)*10)

            // players[player].pos = {...players[player].pos}

            players[player].visualTick()
            

            // players[player].rot.y = lerp(players[player].langle, playerData[player].angle, (time-players[player].lastu)*10)
            // players[player].size.y = lerp(players[player].lh, playerData[player].h, (time-players[player].lastu)*10)
        }
    }

    if (jKeys["KeyF"]) {
        webgpu.dualDepthPeeling = !webgpu.dualDepthPeeling
    }

    if (jKeys["KeyR"]) {
        webgpu.depthLayers -= 1
    }
    if (jKeys["KeyT"]) {
        webgpu.depthLayers += 1
    }

    if (mouse.lclick) {
        input.lockMouse()
    }

    viewProjection = getViewMatrix()

    // lightDir = {
    //     x: 0.85, 
    //     y: Math.cos(time/10 + Math.PI/2), 
    //     z: 0.5*Math.sin(time/10 + Math.PI/2)
    // }

    webgpu.lightBuffer = new Float32Array([lightDir.x, lightDir.y, lightDir.z, 0, 1, 1, 1, 0])
    webgpu.cameraBuffer = new Float32Array([camera.pos.x, camera.pos.y, camera.pos.z, 0])

    // let sceneBuffer = new Float32Array([...viewProjection[1], ...viewProjection[0], ...lightBuffer, ...cameraBuffer, ...viewProjection[0]])

    // webgpu.setGlobalUniform("scene", sceneBuffer)
    // webgpu.setGlobalUniform("light", lightBuffer)

    // camera.rot.y += delta
    // qc.rotateAxis(camera.quat, [0, 0, 1], Math.PI)

    let oQuat = [...camera.quat]

    let axis = qc.rotv3([0, 1, 0], camera.quat)

    qc.rotateAxis(camera.quat, axis, Math.PI*player.getCameraI(2))

    // camera.quat = qc.lookAt([camera.pos.x, camera.pos.y, camera.pos.z], [player.pos.x, player.pos.y, player.pos.z])

    webgpu.updateLights = true

    webgpu.render([0, 0, 0, 1])

    camera.quat = oQuat

    // qc.rotateAxis(camera.quat, [0, 0, 1], -Math.PI)



    cpuTimes.push(performance.now()-start)
    if (cpuTimes.length > 500) cpuTimes.splice(0, 1)

    let cpuAvg = 0
    for (let time of cpuTimes) {
        cpuAvg += time
    }
    cpuAvg /= cpuTimes.length

    let gpuAvg = 0
    for (let time of webgpu.gpuTimes) {
        gpuAvg += time
    }
    gpuAvg /= webgpu.gpuTimes.length

    ui.text(10*su, 15*su, 20*su, `${Math.round(cpuAvg*10)/10}ms CPU (${Math.round(1000/cpuAvg)} FPS) \nAnimation FPS: ${fps2} \n \n${webgpu.dualDepthPeeling ? "Dual Depth Peeling - Faster on high end devices" : "Depth Peeling - Faster on low to mid range devices"} \nRendering Passes: ${webgpu.renderingDepthLayers} \nMax Depth Layers: ${webgpu.depthLayers * 2} \n \nControls: \nR/T - Change Depth Layers \nF - Change Rendering Mode \nV - Show/Hide Spheres`)

    input.updateInput()

    // if (Math.floor(new Date().getTime()/100) > sendDT) {
    //     sendDT = Math.floor(new Date().getTime()/100)
    //     sendData()
    // }

    requestAnimationFrame(frame)
}

setInterval(() => {
    fps2 = fps
    fps = 0
}, 1000)

setInterval(() => {
    sendData()
}, 1000/10)

var sensitivity = 0.002 * 10

let turning = vec2(0, 0)

let mouseMoving = {x: 0, y: 0}
let mouseMoved = {x: 0, y: 0}

input.mouseMove = (event) => {
    input.mouse.x = event.clientX/ui.scale
    input.mouse.y = event.clientY/ui.scale

    if (input.isMouseLocked()) {

        mouseMoving.x += event.movementX
        mouseMoving.y += event.movementY

        // player.turn(event.movementX * sensitivity, event.movementY * sensitivity)

        // player.turn.x = -toTurn.x
    
        // let length = Math.sqrt(player.turn.y**2 + player.turn.x**2)
        // if (length > 1) {
        //     player.turn.x += toTurn.x
        // }

        // player.turn.y = toTurn.y

        // length = Math.sqrt(player.turn.y**2 + player.turn.x**2)
        // if (length > 1) {
        //     player.turn.y -= toTurn.y
        // }
     
    }
}

let scrollSensitivity = 0.1

input.scroll = (x, y) => {
    player.zoom -= y * scrollSensitivity
    player.zoom = Math.min(Math.max(player.zoom, 1), 10)
}