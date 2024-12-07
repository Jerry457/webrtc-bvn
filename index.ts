import "./redirectFetch.ts"
import { serverInfo, bvnVersion } from "./setting"
import { PeerConnectionManager } from "./peerConnectionManager"
import copy from "copy-to-clipboard"

const keyInputElement = document.querySelector("#key")! as HTMLInputElement
const container = document.querySelector("#container")!
const startButton = document.querySelector("#startButton")! as HTMLButtonElement
const shareLink = document.querySelector("#shareLink")!

function generateRandomString(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789" // 包含大小写字母和数字
    let password = ""

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length) // 生成随机索引
        password += characters[randomIndex] // 将随机字符添加到密码中
    }

    return password
}

let pairKey = localStorage.getItem("pairKey")
if (!pairKey) pairKey = generateRandomString(5)
keyInputElement.value = pairKey
localStorage.setItem("pairKey", pairKey)

keyInputElement.addEventListener("change", () => {
    pairKey = keyInputElement.value
    localStorage.setItem("pairKey", pairKey)
})

shareLink.addEventListener("click", () => {
    const linkUrl = new URL(`${location.protocol}//${location.host}/client.html`)
    linkUrl.searchParams.set("key", pairKey!)
    linkUrl.searchParams.set("serverInfo", JSON.stringify(serverInfo))
    copy(linkUrl.href)
    alert("链接已复制")
})

async function videoPeerConnectionHandler(peerConnection: RTCPeerConnection, rufflePlayer: HTMLCanvasElement) {
    const stream = rufflePlayer.captureStream(144)
    const videoTracks = stream.getTracks()
    for (const track of videoTracks) {
        track.applyConstraints({
            width: { min: 1920 },
            height: { min: 1080 },
        })
        peerConnection.addTrack(track)
    }
    const senders = peerConnection.getSenders()
    for (const sender of senders) {
        if (sender && sender.track && sender.track.kind === "video") {
            const parameters = sender.getParameters()
            parameters.encodings[0].maxBitrate = 20000000 // 设置码率为20MB
            parameters.encodings[0].scaleResolutionDownBy = 1.0 // 不缩小分辨率
            await sender.setParameters(parameters)
        }
    }
}

function keyPeerConnectionHandler(
    peerConnection: RTCPeerConnection,
    {
        rufflePlayer,
        peerConnectionManager,
    }: { rufflePlayer: HTMLCanvasElement; peerConnectionManager: PeerConnectionManager }
) {
    const keyChannel = peerConnection.createDataChannel("key", {
        ordered: true,
        negotiated: true,
        id: 0,
    })

    keyChannel.onopen = async () => {
        const { id } = peerConnectionManager.createRTCPeerConnection("video")
        await peerConnectionManager.sendOffer(id)
    }

    keyChannel.onclose = () => {
        console.log("Key Channel is now closed!")
    }

    keyChannel.onmessage = event => {
        const keyInfo = JSON.parse(event.data) as KeyboardEvent
        const keyEvent = new KeyboardEvent(keyInfo.type, keyInfo)
        // console.log(keyEvent)
        rufflePlayer.dispatchEvent(keyEvent)
    }
}

function onPlay(rufflePlayer: HTMLCanvasElement) {
    const rufflePlayerCanvas = rufflePlayer.shadowRoot?.getElementById("container")?.getElementsByTagName("canvas")?.[0]

    if (!rufflePlayerCanvas) return

    // const stream = rufflePlayerCanvas.captureStream(60) // 60 FPS
    // const tracks = stream.getTracks()

    const socket = new WebSocket(serverInfo.wsUrl)
    const peerConnectionManager = new PeerConnectionManager(pairKey!, socket, { iceServers: serverInfo.iceServers })

    peerConnectionManager.addRTCPeerConnectionHandler("video", videoPeerConnectionHandler, rufflePlayerCanvas)
    peerConnectionManager.addRTCPeerConnectionHandler("key", keyPeerConnectionHandler, {
        rufflePlayer,
        peerConnectionManager,
    })
    const { id } = peerConnectionManager.createRTCPeerConnection("key")

    socket.onopen = async () => {
        await peerConnectionManager.sendOffer(id)
    }
}

startButton.addEventListener("click", () => {
    // @ts-ignore
    window.RufflePlayer.config = {
        autoplay: "off",
    }
    // @ts-ignore
    const ruffle = window.RufflePlayer.newest()
    const rufflePlayer = ruffle.createPlayer()

    container?.appendChild(rufflePlayer)
    rufflePlayer
        .ruffle()
        .load(`${bvnVersion}/main.swf`)
        .then(() => onPlay(rufflePlayer))

    startButton.style.display = "none"
})
