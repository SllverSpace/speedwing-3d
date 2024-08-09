
class Player {
    constructor(x, y, z) {
        this.pos = {x: x, y: y, z: z}
        this.size = {x: 0.5, y: 1.5, z: 0.5}
        this.vel = {x: 0, y: 0, z: 0}
        this.rot = {x: 0, y: 0, z: 0}
        this.lrot = {x: 0, y: 0, z: 0}
        this.quat = [0, 0, 0, 1]

        this.frontColour = [0, 0.5, 1, 1]
        this.mainColour = [0, 0.5, 1, 1]
        this.backColour = [0, 0.5, 1, 1]

        let frontColour = this.frontColour
        let mainColour = this.mainColour
        let backColour = this.backColour

        let finishColour = [1, 0, 0, 1]
        let width = 0.2
        let size = 0.5
        let depth = 0.5
        let insideR = 0.3
        let insideRD = -0.5

        this.startV = new webgpu.Box(0, 0, 0, 0.1, 0.1, 0.1, [1, 0, 0, 1])
        this.endV = new webgpu.Box(0, 0, 0, 0.1, 0.1, 0.1, [0, 1, 0, 1])

        this.startV.collisions = false
        this.endV.collisions = false
        this.startV.castShadows = false
        this.endV.castShadows = false

        this.dirVisual = new webgpu.Box(0, 0, 0, 0.1, 0.1, 1, [1, 0, 0, 1])
        this.dirVisual.material.ambient = [1, 0, 0]
        this.dirVisual.material.diffuse = [0, 0, 0]
        this.dirVisual.castShadows = false
        this.dirVisual.collisions = false
        this.lshift = false
        this.camera = 0
        this.cameraI = 0
        this.zoom = 4

        this.trailColour = [0, 0.5, 1, 0.5]

        this.rotated = [0, 0]

        this.colours = [
            [[0, 0.5, 1, 1], [0.25, 0.35, 0.6, 1], [1, 0.5, 0, 1]],
            [[0, 0.5, 1, 0.05], [0, 0.5, 1, 0], [0, 1, 2, 0.1]],
            [[0, 0.5, 1, 1], [0, 0.5, 1, 1], [0, 1, 2, 1]]
        ]

        this.zv = 0

        let vertices = [
            0, 0, depth,
            0, 0, -depth*0.25,

            -size, -width, -depth,
            size, -width, -depth,
            -size, width, -depth,
            size, width, -depth,

            -width, -size, -depth,
            -width, size, -depth,
            width, -size, -depth,
            width, size, -depth,

            -size*insideR, -size*insideR, depth*insideRD,
            size*insideR, -size*insideR, depth*insideRD,
            -size*insideR, size*insideR, depth*insideRD,
            size*insideR, size*insideR, depth*insideRD,
        ]

        let colours = [
            ...frontColour,
            ...backColour,

            ...mainColour,
            ...mainColour,
            ...mainColour,
            ...mainColour,

            ...mainColour,
            ...mainColour,
            ...mainColour,
            ...mainColour,

            ...mainColour,
            ...mainColour,
            ...mainColour,
            ...mainColour,
        ]

        this.visual = new webgpu.Mesh(0, 0, 0, 1, 1, 1, [
            // 0, 0, depth,
            // 0, 0, -depth*0.25,

            // -size, -width, -depth,
            // size, -width, -depth,
            // -size, width, -depth,
            // size, width, -depth,

            // -width, -size, -depth,
            // -width, size, -depth,
            // width, -size, -depth,
            // width, size, -depth,

            // -size*insideR, -size*insideR, depth*insideRD,
            // size*insideR, -size*insideR, depth*insideRD,
            // -size*insideR, size*insideR, depth*insideRD,
            // size*insideR, size*insideR, depth*insideRD,
        ],[
            0, 2, 4,
            5, 3, 0,
            1, 4, 2,
            3, 5, 1,

            8, 6, 0,
            0, 7, 9,
            6, 8, 1,
            1, 9, 7,

            0, 4, 12,
            12, 7, 0,
            
            13, 5, 0,
            0, 9, 13,

            0, 3, 11,
            11, 8, 0,

            0, 6, 10,
            10, 2, 0,



            1, 12, 4,
            7, 12, 1,

            1, 13, 9,
            5, 13, 1,
 
            1, 11, 3,
            8, 11, 1,

            1, 10, 6,
            2, 10, 1,
        ],[],[])
        let final = [this.visual.faces[this.visual.faces.length-1], this.visual.faces[this.visual.faces.length-2], this.visual.faces[this.visual.faces.length-3]]
        for (let i = 0; i < this.visual.faces.length; i++) {
            this.visual.vertices.push(vertices[this.visual.faces[i]*3])
            this.visual.vertices.push(vertices[this.visual.faces[i]*3+1])
            this.visual.vertices.push(vertices[this.visual.faces[i]*3+2])
            this.visual.colours.push(colours[this.visual.faces[i]*4])
            this.visual.colours.push(colours[this.visual.faces[i]*4+1])
            this.visual.colours.push(colours[this.visual.faces[i]*4+2])
            this.visual.colours.push(colours[this.visual.faces[i]*4+3])
            this.visual.faces[i] = i
        }
        this.visual.material = {
            ambient: [1, 1, 1],
            diffuse: [1, 1, 1],
            specular: [0, 0, 0],
            shininess: 128
        }
        this.visual.transparent = true
        this.visual.computeNormals()

        this.frontColour = this.colours[this.camera % 3][0]
        this.mainColour = this.colours[this.camera % 3][1]
        this.backColour = this.colours[this.camera % 3][2]

        this.particles = []

        this.updateColours()
        // this.visual.updateBuffers()
        // this.visual.oneSide = true
        this.visual.collisions = false

        let flameColour = [1, 0.75, 0, 1]
        let endFlameColour = [1, 0.5, 0, 1]
        // this.flame = new webgpu.Box(0, 0, 0, 0.3, 0.3, 0.5, [1, 0.5, 0, 1])
        this.flame = new webgpu.Mesh(0, 0, 0, 0.6, 0.6, 0.5, [
            -0.5, 0, 0,
            0.5, 0, 0,
            0, -0.5, 0,
            0, 0.5, 0,
            0, 0, -1
        ],[
            0, 1, 3,
            0, 2, 3,

            0, 2, 4,
            0, 3, 4,
            1, 2, 4,
            1, 3, 4,
        ],[
            ...flameColour, ...flameColour,
            ...flameColour, ...flameColour,
            ...endFlameColour, 
        ])
        this.flame.computeNormals()
        this.flame.collisions = false
        this.flame.useQuat = true
        this.flame.material.ambient = [1, 1, 1]
        this.flame.material.diffuse = [0, 0, 0]

        this.trail = new webgpu.Mesh(0, 0, 0, 1, 1, 1, [],[],[],[])
        this.trail.transparent = true
        this.trail.material.ambient = [1, 1, 1]
        this.trail.material.diffuse = [0, 0, 0]
        this.trail.castShadows = false

        this.testBox = new webgpu.Box(0, 0, 0, 2, 2, 5, [1, 0, 0, 0.25])
        this.testBox.collisions = false
        this.testBox.transparent = true
        this.testBox.oneSide = false

        this.slope = 1
        this.slopeAmt = 0.001
        this.falling = 0
        this.jumpSpeed = 6
        this.gravity = 15
        this.tsize = 1
        this.crouching = false
    }
    updateColours() {
        let faces = [
            0, 2, 4,
            5, 3, 0,
            1, 4, 2,
            3, 5, 1,

            8, 6, 0,
            0, 7, 9,
            6, 8, 1,
            1, 9, 7,

            0, 4, 12,
            12, 7, 0,
            
            13, 5, 0,
            0, 9, 13,

            0, 3, 11,
            11, 8, 0,

            0, 6, 10,
            10, 2, 0,



            1, 12, 4,
            7, 12, 1,

            1, 13, 9,
            5, 13, 1,
    
            1, 11, 3,
            8, 11, 1,

            1, 10, 6,
            2, 10, 1,
        ]
        let colours = [
            ...this.frontColour,
            ...this.backColour,

            ...this.mainColour,
            ...this.mainColour,
            ...this.mainColour,
            ...this.mainColour,

            ...this.mainColour,
            ...this.mainColour,
            ...this.mainColour,
            ...this.mainColour,

            ...this.mainColour,
            ...this.mainColour,
            ...this.mainColour,
            ...this.mainColour,
        ]

        this.visual.colours = []
        for (let i = 0; i < this.visual.faces.length; i++) {
            this.visual.colours.push(colours[faces[i]*4])
            this.visual.colours.push(colours[faces[i]*4+1])
            this.visual.colours.push(colours[faces[i]*4+2])
            this.visual.colours.push(colours[faces[i]*4+3])
        }
        this.visual.computeNormals()
        this.visual.updateBuffers()
    }
    nearWall(range, width) {
        let offset = qc.rotv3w([0, 0, range/2], this.quat)

        let pos = addvl3([this.pos.x, this.pos.y, this.pos.z], offset)

        this.testBox.quat = [...this.quat]

        // let rot = qc.toEuler(this.quat)

        this.testBox.pos = {x: pos[0], y: pos[1], z: pos[2]}
        this.testBox.size = {x: width, y: width, z: range}
        // this.testBox.rot = {x: rot[0], y: rot[1], z: rot[2]}

        let corners = collisions.getBoxCornersQ(...pos, width, width, range, this.quat)
        let axes = collisions.getBoxAxesQ(this.quat)

        // let corners = collisions.getBoxCorners(...pos, 1, 1, range, )
        // let axes = collisions.getAxes()

        for (let mesh of webgpu.meshes) {
            if ((mesh.collisions || mesh.nearCollisions) && mesh.isBox) {
                if (collisions.BoxRToBoxR(...pos, corners, axes, mesh.pos.x, mesh.pos.y, mesh.pos.z, mesh.getCorners(), mesh.getAxes())) {
                    return true
                }
            }
        }
        return false
    }
    getCameraI(camera) {
        let offset = camera + Math.floor(this.camera/3)*3
        return 1 - Math.min(1, Math.abs(offset - this.cameraI))
    }
    turn(x, y) {
        let invertF = this.getCameraI(2) * 2 - 1

        let rotSpeed = 5

        let axisX = qc.rotv3([0, 1, 0], this.quat)
        let axisY = qc.rotv3([1, 0, 0], this.quat)

        if (!keys["ShiftLeft"]) {
            if (this.lshift) {
                camera.quat = [...this.quat]
            }
            qc.rotateAxis(this.quat, axisX, x * invertF * rotSpeed * delta)
            qc.rotateAxis(this.quat, axisY, -y * rotSpeed * delta)

            qc.rotateAxis(this.flame.quat, axisX, x * invertF * rotSpeed * delta)
            qc.rotateAxis(this.flame.quat, axisY, -y * rotSpeed * delta)

            qc.rotateAxis(this.visual.quat, axisX, x * invertF * rotSpeed * delta)
            qc.rotateAxis(this.visual.quat, axisY, -y * rotSpeed * delta)
        } else {
            axisX = qc.rotv3([0, 1, 0], camera.quat)
            axisY = qc.rotv3([1, 0, 0], camera.quat)

            qc.rotateAxis(camera.quat, axisX, x * invertF * rotSpeed * delta)
            qc.rotateAxis(camera.quat, axisY, -y * rotSpeed * delta)
        }
    }
    tick() {
        qc.rotateAxis(this.flame.quat, [0, 1, 0], -this.rotated[1])
        qc.rotateAxis(this.flame.quat, [1, 0, 0], -this.rotated[0])
        

        let moved = false
        if (this.sprinting) {
            speed *= 2
        }

        this.updateColours()

        let colliding = this.isColliding()
        if (colliding) {
            this.fixCollision(colliding, 0.01)
        }

        this.testBox.visible = keys["KeyG"]

        let nearWall = this.nearWall(5, 2)

        let forward = qc.rotv3w([0, 0, -1], this.quat)
        forward = {x: forward[0], y: forward[1], z: forward[2]}

        let side = qc.rotv3w([nearWall ? 0.2 : 0.1, 0, 0], this.visual.quat)
        let vPos = [this.visual.pos.x, this.visual.pos.y, this.visual.pos.z]

      

        // this.trailColour[0] = Math.sin(time*10)/2+0.5
        // this.trailColour[1] = this.trailColour[0]/2

        // this.trailColour[3] = Math.sin(time*10)/2+0.5

        // this.trailColour[3] = nearWall ? 0.75 : 0.5

        this.trail.vertices.push(...addvl3(vPos, side), ...subvl3(vPos, side))
        this.trail.colours.push(...this.trailColour, ...this.trailColour)
        this.trail.normals.push(0, 1, 0, 0, 1, 0)
        this.trail.faces.push(this.trail.vertices.length/3-1, this.trail.vertices.length/3-2, this.trail.vertices.length/3-3, this.trail.vertices.length/3-2, this.trail.vertices.length/3-3, this.trail.vertices.length/3-4)

        if (this.trail.vertices.length/6 > 1000) {
            this.trail.vertices.splice(0, 6)
            this.trail.colours.splice(0, 8)
            this.trail.normals.splice(0, 6)
            for (let i = 0; i < this.trail.faces.length; i++) {
                this.trail.faces[i] -= 2
                if (this.trail.faces[i] < 0) {
                    this.trail.faces.splice(i, 1)
                    i--
                }
            }
        }

        this.trail.updateBuffers()

        let wallSpeed = 250

        if (nearWall) {
            speed *= wallSpeed
        }

        // let particle = new webgpu.Sphere(this.visual.pos.x, this.visual.pos.y, this.visual.pos.z, 0.2, [1, 0.5, 0, 1], 5)
        // particle.material.ambient = [1, 1, 1]
        // particle.material.diffuse = [0, 0, 0]
        // particle.collisions = false
        // this.particles.push(particle)

        // while (this.particles.length > 100) {
        //     this.particles[0].delete()
        //     this.particles.splice(0, 1)
        // }


        if (keys["KeyW"]) {
            this.vel = addv3(this.vel, mulv3(forward, vec3(speed*delta, speed*delta, speed*delta)))
            // this.vel.x += Math.sin(this.rot.y)*Math.cos(this.rot.x)*speed*delta
            // this.vel.y -= Math.sin(this.rot.x)*speed*delta
            // this.vel.z += Math.cos(this.rot.y)*Math.cos(this.rot.x)*speed*delta
            moved = true
        }
        if (keys["KeyS"]) {
            this.vel = subv3(this.vel, mulv3(forward, vec3(speed*delta, speed*delta, speed*delta)))
            moved = true
        }
        // if (keys["KeyA"]) {
        //     this.vel.x -= Math.cos(camera.rot.y)*speed*delta
        //     this.vel.z += Math.sin(camera.rot.y)*speed*delta
        //     moved = true
        // }
        // if (keys["KeyD"]) {
        //     this.vel.x += Math.cos(camera.rot.y)*speed*delta
        //     this.vel.z -= Math.sin(camera.rot.y)*speed*delta
        //     moved = true
        // }

        if (nearWall) {
            speed /= wallSpeed
        }

        if (this.sprinting) {
            speed /= 2
        }
        if (!moved) {
            this.sprinting = false
        }
        if (jKeys["Space"] && this.falling < 0.1) {
            this.vel.y = this.jumpSpeed
        }
        if (keys["KeyE"]) {
            this.sprinting = true
        }

        if (!input.isMouseLocked()) {
            this.turn.x = lerp(this.turn.x, 0, delta*5)
            this.turn.y = lerp(this.turn.y, 0, delta*5)
        }

        if (keys["KeyD"]) {
            this.zv += delta/5
        }

        if (keys["KeyA"]) {
            this.zv -= delta/5
        }

        if (jKeys["KeyQ"]) {
            this.camera += 1

            this.frontColour = this.colours[this.camera % 3][0]
            this.mainColour = this.colours[this.camera % 3][1]
            this.backColour = this.colours[this.camera % 3][2]
            this.updateColours()
        }

        this.cameraI = lerp(this.cameraI, this.camera, delta*10)

        this.zv = lerp(this.zv, 0, delta*10)

        let roll = this.zv * 100 * delta

        let axisZ = qc.rotv3([0, 0, -1], this.quat)

        qc.rotateAxis(this.quat, axisZ, roll)
        qc.rotateAxis(this.visual.quat, axisZ, roll)
        qc.rotateAxis(this.flame.quat, axisZ, roll)

        let axisZ2 = qc.rotv3([0, 0, -1], this.visual.quat)

        qc.rotateAxis(this.visual.quat, axisZ2, (Math.sqrt(this.vel.x**2 + this.vel.y**2 + this.vel.z**2)/1 + 1) * delta)
        qc.rotateAxis(this.flame.quat, axisZ2, (Math.sqrt(this.vel.x**2 + this.vel.y**2 + this.vel.z**2)/1 + 1) * delta)

        // let rollV = rotv3xzy(vec3(0, 0, roll), vec3(camera.rot.x, -camera.rot.y, camera.rot.z))
        // camera.rot = addv3(camera.rot, rollV)

        // let cosRoll = Math.cos(roll)
        // let sinRoll = Math.sin(roll)

        // let {x, y, z} = camera.rot

        // camera.rot.x = x * cosRoll - z * sinRoll
        // camera.rot.z = x * sinRoll + z * cosRoll



        // camera.rot.x += Math.sin(camera.rot.x) * this.zv * 100 * delta

        // let origX = camera.rot.x
        // let origY = camera.rot.y

        // camera.rot.x = origX * Math.cos(roll) - origY * Math.sin(roll)
        // camera.rot.y = origX * Math.sin(roll) + origY * Math.cos(roll)

        // camera.rot.x += roll * Math.sin(-camera.rot.y)
        // camera.rot.z += roll * Math.cos(-camera.rot.y)
        // camera.rot.w += roll
        // console.log(camera.rot.y)

        if (!keys["ShiftLeft"] && this.crouching) {
            this.size.y += 0.5
            this.pos.y += 0.25
            if (!this.isColliding()) {
                this.crouching = keys["ShiftLeft"]
            }
            this.size.y -= 0.5
            this.pos.y -= 0.25
        } else {
            this.crouching = keys["ShiftLeft"]
        }
        
        
        if (this.crouching) {
            this.tsize = 0.5
        } else {
            this.tsize = 1.25
        }

        let tfov = 60
        if (this.sprinting) {
            tfov = 80
        }
        fov += (tfov - fov) * delta * 7.5

        let dif = (this.tsize - this.size.y) * delta * 10
        this.size.y += dif
        // this.pos.y += dif/2

        if (this.isColliding() && !this.crouching) {
            this.size.y -= dif
            // this.pos.y -= dif/2
            this.crouching = true
        }

        // this.vel.y -= this.gravity*delta
        this.falling += delta

        let friction = nearWall ? 0.375 : 0.01

        this.vel.x = lerp(this.vel.x, 0, delta*100*friction)
        this.vel.y = lerp(this.vel.y, 0, delta*100*friction)
        this.vel.z = lerp(this.vel.z, 0, delta*100*friction)

        if (this.pos.y < -25) {
            this.pos = {x: 0, y: 25, z: 0}
        }
    
        // this.pos.x += this.vel.x*delta
        // if (this.isColliding()) {
        //     this.pos.x -= this.vel.x*delta
        // }

        // this.pos.y += this.vel.y*delta
        // if (this.isColliding()) {
        //     if (this.vel.y < 0) {
        //         this.falling = 0
        //     }
        //     this.pos.y -= this.vel.y*delta
        //     this.vel.y = 0
        // }

        // this.pos.z += this.vel.z*delta
        // if (this.isColliding()) {
        //     this.pos.z -= this.vel.z*delta
        // }
        this.move(this.vel.x*delta, this.vel.y*delta, this.vel.z*delta, 10)

        // console.log(this.vel.y)

        this.rot = camera.rot

        this.visual.pos = {...this.pos}
        // this.visual.pos.y += 0.5
        // this.visual.rot.z = Math.PI/4
        // this.visual.rot.z += Math.sqrt(this.vel.x**2 + this.vel.y**2 +  this.vel.z**2) * delta * 2
        // this.visual.size = {...this.size}

        if (!keys["ShiftLeft"]) camera.quat = qc.interpolate(camera.quat, this.quat, delta*20)

        // camera.quat = [...this.quat]

        if (!keys["ShiftLeft"]) {
            this.visual.rot.y = lerp(this.visual.rot.y, this.rot.y, delta*10)
            this.visual.rot.x = lerp(this.visual.rot.x, this.rot.x, delta*10)
            this.visual.rot.z = lerp(this.visual.rot.z, this.rot.z, delta*10)
            // this.visual.rot.z += Math.sqrt(this.vel.x**2 + this.vel.y**2 +  this.vel.z**2) * delta * 2 + delta * 2

            // this.visual.quat.x += delta

            

            // this.visual.quat = qc.interpolate(this.visual.quat, this.quat, delta*10)

            // if (keys["KeyG"]) {
            //     qc.rotateAxis(this.visual.quat, [0, 1, 0], delta)
            //     // this.visual.quat.x -= delta
            //     // qc.forceV(this.visual.quat, "x", this.visual.quat.x)
            // }
            // if (keys["KeyH"]) {
            //     qc.rotateAxis(this.visual.quat, [1, 0, 0], delta)
            //     // this.visual.quat.x += delta
            //     // qc.forceV(this.visual.quat, "x", this.visual.quat.x)
            // }
            // if (keys["KeyV"]) {
            //     qc.rotateAxis(this.visual.quat, qc.rotv3([0, 0, 1], this.visual.quat), delta)
            // }
            // if (keys["KeyB"]) {
            //     qc.rotateAxis(this.visual.quat, qc.rotv3([1, 0, 0], this.visual.quat), delta)
            // }
            // if (keys["KeyN"]) {
            //     qc.rotateAxis(this.visual.quat, qc.rotv3([0, 1, 0], this.visual.quat), delta)
            // }

            // this.startV.pos = {...this.pos}
            // this.endV.pos = {...this.pos}

            let move = qc.rotv3w([0, 0, -1], this.visual.quat)
            this.startV.pos.x += move[0]*2
            this.startV.pos.y += move[1]*2
            this.startV.pos.z += move[2]*2

            let move2 = qc.rotv3w([-1, 0, 0], this.visual.quat)
            this.endV.pos.x += move2[0]*2
            this.endV.pos.y += move2[1]*2
            this.endV.pos.z += move2[2]*2

            // console.log(qc.getForward(this.visual.quat), qc.getPerp(qc.getForward(this.visual.quat)))

            // this.visual.quat = nv4(this.visual.quat)
            
        }

        // this.rot.x -= this.turn.y * delta
        // this.rot.y += this.turn.x * delta

        let xzlength = Math.sqrt((camera.pos.x-this.pos.x)**2 + (camera.pos.z-this.pos.z)**2)

        this.lshift = keys["ShiftLeft"]
       
        let d = Math.sqrt((camera.pos.x-this.pos.x)**2 + (camera.pos.y-this.pos.y)**2 + (camera.pos.z-this.pos.z)**2)
        let factor = d-3
        
        // if (!keys["ShiftLeft"]) {
        //     camera.pos = addv3(camera.pos, mulv3(subv3(this.pos, camera.pos), vec3(factor*delta, factor*delta, factor*delta)))
        // } else {
        //     camera.pos = addv3(this.pos, rotv3(vec3(0, 0, -4), camera.rot))
        // }
        

        this.lrot = {...camera.rot}

        let turnL = Math.sqrt(this.turn.x**2 + this.turn.y**2)

        let turnN = divv2(this.turn, vec2(turnL, turnL))
        turnN.x = turnN.x ? turnN.x : 0
        turnN.y = turnN.y ? turnN.y : 0

        let start = addv3(this.pos, rotv3(vec3(0, 0, 0.5), this.rot))

        let end = addv3(this.pos, rotv3(vec3(this.turn.x, this.turn.y, 0.5), this.rot))

        // this.endV.pos = end

        // this.startV.visible = false
        // this.endV.visible = false

        this.dirVisual.pos = divv3(addv3(start, end), vec3(2, 2, 2))
        this.dirVisual.size.z = Math.sqrt(this.turn.x**2 + this.turn.y**2)
        this.dirVisual.visible = false

        xzlength = Math.sqrt((end.x-start.x)**2 + (end.z-start.z)**2)

        this.dirVisual.rot.y = Math.atan2(end.x-start.x, end.z-start.z)+Math.PI
        this.dirVisual.rot.x = Math.atan2(end.y-start.y, xzlength)

        // console.log(start, end)

        let offsets = [
            [0, 0, this.zoom],
            [0, 0, 0],
            [0, 0, -this.zoom]
        ]
        // offset2 = addvl3(offset2, )

        let offset = qc.rotv3w(offsets[this.camera % 3], this.quat)
        if (keys["ShiftLeft"]) {
            offset = qc.rotv3w(offsets[this.camera % 3], camera.quat)
        }
        offset = {x: offset[0], y: offset[1], z: offset[2]}


        let raycast = collisions.raycast(webgpu.meshes, this.pos.x, this.pos.y, this.pos.z, offset.x/this.zoom, offset.y/this.zoom, offset.z/this.zoom, this.zoom, 0.01)

        let intFactors = [
            delta*5,
            delta*15,
            delta*5
        ]

        if (this.getCameraI(1) > 0.99) {
            intFactors[1] = 1
        }

        let intFactor = intFactors[this.camera % 3] // delta*5
        camera.pos = addv3(mulv3(subv3(raycast, camera.pos), vec3(intFactor, intFactor, intFactor)), camera.pos)

        let factor2 = Math.cos(camera.rot.z)

        turning = {...this.turn}

        let flameOffset = qc.rotv3w([0, 0, 0.25], this.visual.quat)
        flameOffset = {x: flameOffset[0], y: flameOffset[1], z: flameOffset[2]}

        this.flame.pos = addv3(this.visual.pos, flameOffset)

        this.rotated = [lerp(this.rotated[0], Math.random()/3-1/3/2, delta*15), lerp(this.rotated[1], Math.random()/3-1/3/2, delta*15)]


        // this.rotated[0] += (Math.random()*2-1)/5
        // this.rotated[1] += (Math.random()*2-1)/5

        // this.rotated[0] *= 0.9
        // this.rotated[1] *= 0.9

        // this.rotated = [Math.PI/8, 0]

        qc.rotateAxis(this.flame.quat, [1, 0, 0], this.rotated[0])
        qc.rotateAxis(this.flame.quat, [0, 1, 0], this.rotated[1])

        // turning.y *= Math.cos(camera.rot.x)
        // turning = mulv2(turning, vec2(factor2, factor2))

        
        // camera.pos = raycast

        qc.normalize(this.quat)

        ui.line(canvas.width/2, canvas.height/2, canvas.width/2 + turning.x*100*su, canvas.height/2 + turning.y*100*su, turnL*su*20, [0, 127, 255, 0.5])
    }
    getCData() {
        let corners = collisions.getBoxCorners(this.pos.x, this.pos.y, this.pos.z, this.size.x, this.size.y, this.size.z, 0, camera.rot.y, 0)
        let axes = collisions.getBoxAxes(0, camera.rot.y, 0)

        return [corners, axes]
    }
    fixCollision(mesh, stepSize, max=10) {
        
        let cData = this.getCData()

        let axeso = mesh.getAxes()
        let axes = []
        for (let axis of axeso) {
            axes.push([axis[0], axis[1], axis[2]])
            axes.push([-axis[0], -axis[1], -axis[2]])
        }

        let axesd = []

        for (let axis of axes) {
            let d = 0
            let colliding = this.isCollidingObj(cData[0], cData[1], mesh)
            while (colliding && d < max) {
                d += stepSize
                this.pos.x += axis[0] * stepSize
                this.pos.y += axis[1] * stepSize
                this.pos.z += axis[2] * stepSize
                cData = this.getCData()
                colliding = this.isCollidingObj(cData[0], cData[1], mesh)
            }
            this.pos.x -= axis[0] * d
            this.pos.y -= axis[1] * d
            this.pos.z -= axis[2] * d
            cData = this.getCData()
            axesd.push([axis, d])
        }
        axesd.sort((a, b) => a[1] - b[1])
        this.pos.x += axesd[0][0][0] * axesd[0][1]
        this.pos.y += axesd[0][0][1] * axesd[0][1]
        this.pos.z += axesd[0][0][2] * axesd[0][1]
        this.vel.x += axesd[0][0][0] * axesd[0][1] * mesh.push
        this.vel.y += axesd[0][0][1] * axesd[0][1] * mesh.push
        this.vel.z += axesd[0][0][2] * axesd[0][1] * mesh.push
    }
    move(x, y, z, steps) {
        steps = Math.round(steps)

        for (let i = 0; i < steps; i++) {
            this.pos.x += x / steps
            if (this.isColliding()) {
                this.pos.y += this.slope * Math.abs(x / steps)
                if (!this.isColliding()) {
                    this.pos.y -= this.slope * Math.abs(x / steps)
                    while (this.isColliding()) {
                        this.pos.y += this.slopeAmt
                    }
                } else {
                    this.pos.y -= this.slope * Math.abs(x / steps) * 2
                    if (!this.isColliding()) {
                        this.pos.y += this.slope * Math.abs(x / steps)
                        while (this.isColliding()) {
                            this.pos.y -= this.slopeAmt
                        }
                    } else {
                        this.pos.y += this.slope * Math.abs(x / steps)
                        this.pos.x -= x / steps
                        this.vx = 0
                        break
                    }
                }
            } else if (y < 0) {
                this.pos.y -= this.slope*1.5 * Math.abs(x / steps)
                if (this.isColliding()) {
                    this.pos.y += this.slope*1.5 * Math.abs(x / steps)
                    while (!this.isColliding()) {
                        this.pos.y -= this.slopeAmt
                    }
                    this.pos.y += this.slopeAmt
                } else {
                    this.pos.y += this.slope*1.5 * Math.abs(x / steps)
                }
            }
        }

        // for (let i = 0; i < steps; i++) {
        //     this.pos.x += x / steps
        //     if (this.isColliding()) {
        //         this.pos.x -= x / steps
        //         break
        //     }
        // }

        for (let i = 0; i < steps; i++) {
            this.pos.z += z / steps
            if (this.isColliding()) {
                this.pos.y += this.slope * Math.abs(z / steps)
                if (!this.isColliding()) {
                    this.pos.y -= this.slope * Math.abs(z / steps)
                    while (this.isColliding()) {
                        this.pos.y += this.slopeAmt
                    }
                } else {
                    this.pos.y -= this.slope * Math.abs(z / steps) * 2
                    if (!this.isColliding()) {
                        this.pos.y += this.slope * Math.abs(z / steps)
                        while (this.isColliding()) {
                            this.pos.y -= this.slopeAmt
                        }
                    } else {
                        this.pos.y += this.slope * Math.abs(z / steps)
                        this.pos.z -= z / steps
                        this.vz = 0
                        break
                    }
                }
            } else if (y < 0) {
                this.pos.y -= this.slope*1.5 * Math.abs(z / steps)
                if (this.isColliding()) {
                    this.pos.y += this.slope*1.5 * Math.abs(z / steps)
                    while (!this.isColliding()) {
                        this.pos.y -= this.slopeAmt
                    }
                    this.pos.y += this.slopeAmt
                } else {
                    this.pos.y += this.slope*1.5 * Math.abs(z / steps)
                }
            }
        }

        // for (let i = 0; i < steps; i++) {
        //     this.pos.z += z / steps
        //     if (this.isColliding()) {
        //         this.pos.z -= z / steps
        //         break
        //     }
        // }

        for (let i = 0; i < steps; i++) {
            this.pos.y += y / steps
            if (this.isColliding()) {
                this.pos.y -= y / steps
                if (y < 0) {
                    this.falling = 0
                }
                this.vel.y = 0
                break
            }
        }
    }
    isCollidingObj(corners, axes, mesh) {
        if (!mesh.collisions) return false
        if (mesh.isBox) {
            if (Math.sqrt((this.pos.x-mesh.pos.x)**2 + (this.pos.y-mesh.pos.y)**2 + (this.pos.z-mesh.pos.z)**2) < Math.max(this.size.x, this.size.y, this.size.z)*1.5 + Math.max(mesh.size.x, mesh.size.y, mesh.size.z)*1.5) {
                if (collisions.BoxRToBoxR(this.pos.x, this.pos.y, this.pos.z, corners, axes, mesh.pos.x, mesh.pos.y, mesh.pos.z, mesh.getCorners(), mesh.getAxes())) {
                    // console.log(mesh)
                    return true
                }
            }
            // if (mesh.rotated) {
                
            // } else {
            //     if (collisions.BoxToBox(this.pos.x, this.pos.y, this.pos.z, this.size.x, this.size.y, this.size.z, mesh.pos.x, mesh.pos.y, mesh.pos.z, mesh.size.x, mesh.size.y, mesh.size.z)) {
            //         return true
            //     }
            // }
        } else if (mesh.isSphere) {
            if (Math.sqrt((this.pos.x-mesh.pos.x)**2 + (this.pos.y-mesh.pos.y)**2 + (this.pos.z-mesh.pos.z)**2) < Math.max(this.size.x, this.size.y, this.size.z)*1.5 + mesh.radius) {
                if (collisions.BoxRToSphere(corners, mesh.pos.x, mesh.pos.y, mesh.pos.z, mesh.radius)) {
                    return true
                }
            }
        }
        return false
    }
    isColliding() {
        let cData = this.getCData()

        for (let mesh of webgpu.meshes) {
            let colliding = this.isCollidingObj(cData[0], cData[1], mesh)
            if (colliding) {
                return mesh
            }
        }
        return false
    }
    delete() {
        this.visual.delete()
        this.testBox.delete()
        this.trail.delete()
        this.flame.delete()
        this.dirVisual.delete()
        this.startV.delete()
        this.endV.delete()
    }
}