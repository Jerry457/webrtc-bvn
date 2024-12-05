import { serverInfo, setServerInfo } from "./setting"
import { PeerConnectionManager } from "./peerConnectionManager"

const videoElement = document.getElementById("remoteVideo") as HTMLVideoElement

function videoPeerConnectionHandler(peerConnection: RTCPeerConnection) {
    peerConnection.ontrack = event => {
        console.log("video track received")

        const mediaStream = new MediaStream()
        mediaStream.addTrack(event.track)
        videoElement.srcObject = mediaStream

        const id = setInterval(async () => {
            if (videoElement.srcObject && videoElement.paused) {
                videoElement.play()
            } else {
                clearInterval(id)
            }
        }, 1000)
    }
}

function keyPeerConnectionHandler(peerConnection: RTCPeerConnection) {
    const keyChannel = peerConnection.createDataChannel("keyChannel", {
        ordered: true,
        negotiated: true,
        id: 0,
    })

    keyChannel.onopen = () => {
        console.log("keyChannel open")
    }

    keyChannel.onclose = () => {
        console.log("keyChannel cloned")
    }

    keyChannel.onmessage = event => {}

    function onKey(event: KeyboardEvent) {
        if (keyChannel.readyState === "open") {
            const data = {}

            for (let key in event) {
                const value = event[key]
                if (typeof value !== "function" && typeof value !== "object") {
                    data[key] = event[key]
                }
            }

            // console.log(data)
            keyChannel.send(JSON.stringify(data))
        }
    }

    document.addEventListener("keydown", onKey)
    document.addEventListener("keyup", onKey)
}

const keyInput = document.getElementById("keyInput") as HTMLInputElement
const connectButton = document.getElementById("connectButton") as HTMLButtonElement

async function connect(key: string) {
    const socket = new WebSocket(serverInfo.wsUrl)

    const peerConnectionManager = new PeerConnectionManager(key, socket, { iceServers: serverInfo.iceServers })

    peerConnectionManager.addRTCPeerConnectionHandler("video", videoPeerConnectionHandler)
    peerConnectionManager.addRTCPeerConnectionHandler("key", keyPeerConnectionHandler)
    peerConnectionManager.createRTCPeerConnection("video")
    const { id } = peerConnectionManager.createRTCPeerConnection("key")
    socket.addEventListener("open", async () => {
        await peerConnectionManager.sendOffer(id)
    })
}

connectButton.addEventListener("click", () => connect(keyInput.value))

const urlParams = new URLSearchParams(window.location.search)
const key = urlParams.get("key")

const server = urlParams.get("server")
if (server) {
    const serverInfo = JSON.parse(server)
    setServerInfo(serverInfo)
}

if (key) {
    keyInput.value = key
}
