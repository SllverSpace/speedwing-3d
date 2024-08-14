function hslToRgb(h, s, l, a) {
	h /= 360
	s /= 100
	l /= 100
    let r, g, b

    if (s == 0) {
        r = g = b = l
    } else {
        const hue2rgb = function hue2rgb(p, q, t) {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1 / 6) return p + (q - p) * 6 * t
            if (t < 1 / 2) return q
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
            return p
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q
        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255), a]
}

function rotv3xzy(vec, rot) {

    // let x1 = vec.x * Math.cos(rot.z) - vec.y * Math.sin(rot.z)
    // let y1 = vec.x * Math.sin(rot.z) + vec.y * Math.cos(rot.z)

    // let y2 = y1 * Math.cos(rot.x) - vec.z * Math.sin(rot.x)
    // let z1 = y1 * Math.sin(rot.x) + vec.z * Math.cos(rot.x)

    // let x2 = x1 * Math.cos(rot.y) + z1 * Math.sin(rot.y)
    // let z2 = -x1 * Math.sin(rot.y) + z1 * Math.cos(rot.y)

    // inverse ordering, YXZ = ZXY, XZY = YZX, ZXY = YXZ

    let x1 = vec.x * Math.cos(rot.y) + vec.z * Math.sin(rot.y)
    let z1 = -vec.x * Math.sin(rot.y) + vec.z * Math.cos(rot.y)

    let y1 = vec.y * Math.cos(-rot.x) - z1 * Math.sin(-rot.x)
    let z2 = vec.y * Math.sin(-rot.x) + z1 * Math.cos(-rot.x)

    let x2 = x1 * Math.cos(rot.z) - y1 * Math.sin(rot.z)
    let y2 = -x1 * Math.sin(rot.z) + -y1 * Math.cos(rot.z)

    return {x: x2, y: y2, z: z2}
}

function rotv22(vec, angle) {
    const radians = angle
    const cos = Math.cos(radians)
    const sin = Math.sin(radians)

    const newX = vec.x * cos - vec.y * sin
    const newY = vec.x * sin + vec.y * cos

    return { x: newX, y: newY }
}

class QuatC {
    rotateAxis(quat2, axis, angle) {
        let rotationQuat = quat.create()
        quat.setAxisAngle(rotationQuat, axis, angle)
        return quat.multiply(quat2, rotationQuat, quat2)
    }
    getForward(quat) {
        let forward = utils.prev.vec3.fromValues(0, 0, -1)
        let direction = utils.prev.vec3.create()
        utils.prev.vec3.transformQuat(direction, forward, quat)
        return [direction[0], direction[1], -direction[2]]
    }
    getPerp(vec) {
        let u = [0, 0, 1]
        return utils.prev.vec3.cross(utils.prev.vec3.create(), [vec[2], vec[1], vec[0]], u)
    }
    rotv3w(vec, quat) {
        let direction = utils.prev.vec3.create()
        utils.prev.vec3.transformQuat(direction, vec, quat)
        return [direction[0], direction[1], -direction[2]]
    }
    rotv3(vec, quat) {
        let direction = utils.prev.vec3.create()
        utils.prev.vec3.transformQuat(direction, vec, quat)
        return direction
    }
    interpolate(quat1, quat2, factor) {
        let x = utils.lerp(quat1[0], quat2[0], factor)
        let y = utils.lerp(quat1[1], quat2[1], factor)
        let z = utils.lerp(quat1[2], quat2[2], factor)
        let w = utils.lerp(quat1[3], quat2[3], factor)
        return [x, y, z, w]
    }
    interpolateT(quat1, quat2, tickrate, accumulator) {
        let x = utils.interpVar(quat1[0], quat2[0], tickrate, accumulator)
        let y = utils.interpVar(quat1[1], quat2[1], tickrate, accumulator)
        let z = utils.interpVar(quat1[2], quat2[2], tickrate, accumulator)
        let w = utils.interpVar(quat1[3], quat2[3], tickrate, accumulator)
        return [x, y, z, w]
    }
    lookAt(origin, target, upV=[0,1,0]) {
        let vec32 = utils.prev.vec3
        let direction = vec32.create()
        let right = vec32.create()
        let up = vec32.create()

        vec32.subtract(direction, target, origin)
        vec32.normalize(direction, direction)

        vec32.cross(right, upV, direction)
        vec32.normalize(right, right)
    
        vec32.cross(up, direction, right)

        let rotationMatrix = mat4.fromValues(
            right[0], up[0], direction[0], 0,
            right[1], up[1], direction[1], 0,
            right[2], up[2], direction[2], 0,
            0, 0, 0, 1
        )

        let quaternion = quat.create()
        quat.fromMat3(quaternion, mat3.fromMat4(mat3.create(), rotationMatrix))

        return quaternion
    }
    toEuler(quat) {        
        let euler = [
            Math.atan2(2 * (quat[0] * quat[1] + quat[2] * quat[3]), 1 - 2 * (quat[1] * quat[1] + quat[2] * quat[2])),
            Math.asin(2 * (quat[0] * quat[2] - quat[3] * quat[1])),
            Math.atan2(2 * (quat[0] * quat[3] + quat[1] * quat[2]), 1 - 2 * (quat[2] * quat[2] + quat[3] * quat[3]))
        ]
      
        return euler
    }
    normalize(quat) {
        let length = Math.sqrt(quat[0]**2 + quat[1]**2 + quat[2]**2 + quat[3]**2)
        if (length > 0) {
            quat[0] /= length
            quat[1] /= length
            quat[2] /= length
            quat[3] /= length
        }
    }
}

var qc = new QuatC()