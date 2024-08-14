
var ws
var connected = false

var data = {}
var playerData = {}
var id = 0

var vid = ""
var vidLoaded = localStorage.getItem("id")
var letters = "abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRS0123456789"
if (vidLoaded) {
	vid = vidLoaded
} else {
	for (let i = 0; i < 8; i++) {
		vid += letters[Math.round(Math.random()*(letters.length-1))]
	}
	localStorage.setItem("id", vid)
}

function getViews() {
	ws.send(JSON.stringify({getViews: true}))
}

function sendMsg(sendData, bypass=false) {
	if (ws.readyState == WebSocket.OPEN && (connected || bypass)) {
		ws.send(JSON.stringify(sendData))
	}
}

var wConnect = false
var players = {}

var lastTick = 0

function connectToServer() {
    console.log("Connecting...")
    if (ws) {
        if (ws.readyState == WebSocket.OPEN) {
			ws.close()
		}
    }
    connected = false
    id = 0
    ws = new WebSocket("wss://server.silverspace.online:443")

    ws.addEventListener("open", (event) => {
        sendMsg({connect: "speedwing-3d"}, true)
    })

    ws.addEventListener("message", (event) => {
        let msg = JSON.parse(event.data)
        if ("connected" in msg) {
            console.log("Connected!")
            connected = true
            id = msg.connected
            sendMsg({view: vid})
            data = {}
            sendData()
        }
        if ("ping" in msg && !document.hidden) {
            sendMsg({ping: true})
        }
        if ("views" in msg) {
            console.log(JSON.stringify(msg.views))
        }
        if ("data" in msg) {
            // let id = parseInt(msg.data[0])
            // let data = msg.data[1]

            // playerData[id] = data

            // if (id in players) {
            //     players[id].lx = players[id].pos.x
            //     players[id].ly = players[id].pos.y
            //     players[id].lz = players[id].pos.z

            //     players[id].lqx = players[id].visual.quat[0]
            //     players[id].lqy = players[id].visual.quat[1]
            //     players[id].lqz = players[id].visual.quat[2]
            //     players[id].lqw = players[id].visual.quat[3]

            //     console.log(time - players[id].lastu)

            //     players[id].lastu = time
            // }
            
            for (let player in msg.data) {
                if (!(player in playerData)) {
                    playerData[player] = msg.data[player]
                }
            }
            for (let player in playerData) {
                if (!(player in msg.data)) {
                    delete playerData[player]
                } else {
                    playerData[player] = {...playerData[player], ...msg.data[player]}
                }
            }
            for (let player in playerData) {
                if (player in players) {
                    players[player].lx = players[player].pos.x
                    players[player].ly = players[player].pos.y
                    players[player].lz = players[player].pos.z

                    players[player].lqx = players[player].quat[0]
                    players[player].lqy = players[player].quat[1]
                    players[player].lqz = players[player].quat[2]
                    players[player].lqw = players[player].quat[3]

                    // console.log(time - players[player].lastu)
                    players[player].lastu = time
                }
            }
        }
        // if ("players" in msg) {
        //     for (let player in playerData) {
        //         if (!msg.players.includes(player)) {
        //             delete playerData[player]
        //         }
        //     }
        // }
        // if ("allData" in msg) {
        //     playerData = msg.allData
        // }
        if ("tick" in msg) {
            // console.log(time - lastTick)
            lastTick = time
        }
    })

    ws.addEventListener("close", (event) => {
        console.log("Disconnected")
        wConnect = true
    })
}

connectToServer()

function sendData() {
    // console.log("sending data", new Date().getTime())
    data = {
        x: Math.round(player.pos.x*100)/100,
        y: Math.round(player.pos.y*100)/100,
        z: Math.round(player.pos.z*100)/100,
        qx: Math.round(player.visual.quat[0]*100)/100,
        qy: Math.round(player.visual.quat[1]*100)/100,
        qz: Math.round(player.visual.quat[2]*100)/100,
        qw: Math.round(player.visual.quat[3]*100)/100,
    }
    sendMsg({data: data})
}
