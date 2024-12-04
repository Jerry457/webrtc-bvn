const clients = new Set<WebSocket>()

function handleRequest(req: Request) {
    if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, { status: 501 })
    }

    const { socket, response } = Deno.upgradeWebSocket(req)

    socket.onopen = function () {
        console.log("a client connected!")
        clients.add(socket)
    }

    socket.onmessage = function (event) {
        const message = JSON.parse(event.data)
        console.log("Received message:", message.id, message.type)
        for (const client of clients) {
            if (client !== socket) {
                client.send(event.data)
            }
        }
    }

    socket.onclose = () => {
        console.log("A WebSocket connection closed.")
        clients.delete(socket)
    }

    return response
}

Deno.serve({ port: 8000 }, handleRequest)
