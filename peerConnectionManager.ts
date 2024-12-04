type userData = {
    id: string
    key: string
    pcType: string
}

export type OfferMessage = userData & {
    type: "offer"
    payload: RTCSessionDescriptionInit
}

export type AnswerMessage = userData & {
    type: "answer"
    payload: RTCSessionDescriptionInit
}

export type IceCandidateMessage = userData & {
    type: "ice-candidate"
    payload: RTCIceCandidate
}

export type WebSocketMessage = OfferMessage | AnswerMessage | IceCandidateMessage

export type PeerConnectionHandler = {
    parms?: any
    fn: (pc: RTCPeerConnection, parms: PeerConnectionHandler["parms"]) => void
}

export class PeerConnectionManager {
    key: string
    socket: WebSocket
    idPeerConnectionDataMap: Map<
        string,
        {
            id: string
            pcType: string
            peerConnection: RTCPeerConnection
        }
    >
    peerConnectionHandlerMap: Map<string, PeerConnectionHandler>

    configuration?: RTCConfiguration

    constructor(key: string, socket: WebSocket, configuration?: RTCConfiguration) {
        this.key = key
        this.socket = socket
        this.idPeerConnectionDataMap = new Map()
        this.peerConnectionHandlerMap = new Map()
        this.configuration = configuration

        this.socket.addEventListener("message", e => this.onSocketMessage(e))
    }

    async sendOffer(id: string) {
        const { peerConnection, pcType } = this.idPeerConnectionDataMap.get(id)!
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        this.socket.send(
            JSON.stringify({ key: this.key, id, pcType, type: "offer", payload: offer } satisfies OfferMessage)
        )
    }

    async onSocketMessage(event: MessageEvent<string>) {
        const message = JSON.parse(event.data) as WebSocketMessage

        if (message.key!== this.key) {
            return
        }

        let peerConnectionData = this.idPeerConnectionDataMap.get(message.id)

        if (message.type === "offer") {
            if (!peerConnectionData) peerConnectionData = this.createRTCPeerConnection(message.pcType, message.id)

            const peerConnection = peerConnectionData.peerConnection

            await peerConnection.setRemoteDescription(message.payload)
            const answer = await peerConnection.createAnswer()
            await peerConnection.setLocalDescription(answer)

            this.socket.send(
                JSON.stringify({
                    type: "answer",
                    payload: answer,
                    id: message.id,
                    key: this.key,
                    pcType: message.pcType,
                } satisfies AnswerMessage)
            )
        } else if (message.type === "answer")
            await peerConnectionData!.peerConnection.setRemoteDescription(message.payload)
        else if (message.type === "ice-candidate")
            await peerConnectionData!.peerConnection!.addIceCandidate(message.payload)
    }

    addRTCPeerConnectionHandler(
        pcType: string,
        fn: PeerConnectionHandler["fn"],
        parms?: PeerConnectionHandler["parms"]
    ) {
        this.peerConnectionHandlerMap.set(pcType, { fn, parms })
    }

    createRTCPeerConnection(pcType: string, id?: string) {
        id = id || crypto.randomUUID()
        const peerConnection = new RTCPeerConnection()
        this.idPeerConnectionDataMap.set(id, {
            id,
            pcType,
            peerConnection,
        })

        peerConnection.addEventListener("icecandidate", (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                this.socket.send(
                    JSON.stringify({
                        id,
                        key: this.key,
                        pcType,
                        type: "ice-candidate",
                        payload: event.candidate,
                    } satisfies IceCandidateMessage)
                )
            }
        })

        peerConnection.addEventListener("connectionstatechange", () => {
            if (
                peerConnection.connectionState === "failed" ||
                peerConnection.connectionState === "closed" ||
                peerConnection.connectionState === "disconnected"
            ) {
                peerConnection.close()
                this.idPeerConnectionDataMap.delete(id)
            }
        })

        const handler = this.peerConnectionHandlerMap.get(pcType)
        if (handler) {
            handler.fn(peerConnection, handler.parms)
        }

        return {
            id,
            pcType,
            peerConnection,
        }
    }
}
