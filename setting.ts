export let bvnVersion = "BVN2.6-Competitive"

const versionSelect = document.querySelector("#versionSelect") as HTMLSelectElement | null
versionSelect?.addEventListener("change", () => {
    console.log("version changed to", bvnVersion)
    localStorage.setItem("version", bvnVersion)
    bvnVersion = versionSelect.value
})
if (versionSelect) {
    const version = localStorage.getItem("version")
    if (version) {
        bvnVersion = version
        versionSelect.value = bvnVersion
    }
}

export const serverInfo: {
    wsUrl: string
    iceServers: RTCIceServer[]
} = {
    wsUrl: "",
    iceServers: [],
}

const settingButton = document.getElementById("settingButton")!
const settingModal = document.getElementById("settingModal")!
const settingModalCloseButton = document.getElementById("settingModalCloseButton")!

const webSocketUrlInput = document.getElementById("webSocketUrl")! as HTMLInputElement
const iceServerUrlInput = document.getElementById("iceServerUrl")! as HTMLInputElement
const userNameInput = document.getElementById("iceServerUsername")! as HTMLInputElement
const passwordInput = document.getElementById("iceServerPassword")! as HTMLInputElement

const linkUrl = new URL(`${location.protocol}//${location.host}/client.html`)
const shareLink = document.querySelector("#shareLink")
shareLink?.addEventListener("click", () => {
    navigator.clipboard.writeText(linkUrl.href)
    alert("链接已复制")
})

function onUpdateServerInfo() {
    webSocketUrlInput.value = serverInfo.wsUrl
    if (serverInfo.iceServers.length > 0) {
        iceServerUrlInput.value = serverInfo.iceServers[0].urls as string
        userNameInput.value = serverInfo.iceServers[0].username || ""
        passwordInput.value = serverInfo.iceServers[0].credential || ""
    }
    // @ts-ignore
    if (!window.pairKey) {
        return
    }
    // @ts-ignore
    linkUrl.searchParams.set("key", window.pairKey)
    linkUrl.searchParams.set("servers", JSON.stringify(serverInfo))
}

export function setServerInfo(wsUrl?: string, urls?: string, username?: string, credential?: string) {
    if (wsUrl) {
        serverInfo.wsUrl = wsUrl
    }

    if (urls) {
        if (urls === "") {
            serverInfo.iceServers.length = 0
        } else {
            credential = credential === "" ? undefined : credential
            username = username === "" ? undefined : username
            serverInfo.iceServers = [{ urls: urls, username, credential }]

            localStorage.setItem("iceServerUrl", iceServerUrlInput.value)
            if (credential) localStorage.setItem("iceServerPassword", credential)
            if (username) localStorage.setItem("iceServerUsername", username)
        }
    }

    onUpdateServerInfo()
}

function onIceServerInput() {
    setServerInfo(serverInfo.wsUrl, iceServerUrlInput.value, userNameInput.value, passwordInput.value)
}

iceServerUrlInput.addEventListener("change", onIceServerInput)
userNameInput.addEventListener("change", onIceServerInput)
passwordInput.addEventListener("change", onIceServerInput)

webSocketUrlInput.addEventListener("change", () => {
    setServerInfo(serverInfo.wsUrl)
})

settingButton.addEventListener("click", () => {
    settingModal.style.display = "block"
})

settingModalCloseButton.addEventListener("click", () => {
    settingModal.style.display = "none"
})


window.addEventListener("load", () => {
    const wsUrl = localStorage.getItem("wsUrl") || ""
    const iceServerUrl = localStorage.getItem("iceServerUrl") || ""
    const iceServerPassword = localStorage.getItem("iceServerPassword") || ""
    const iceServerUsername = localStorage.getItem("iceServerUsername") || ""
    // @ts-ignore
    if (import.meta.env.MODE === "development") {
        serverInfo.wsUrl = "ws://localhost:8000"
    }

    setServerInfo(wsUrl, iceServerUrl, iceServerUsername, iceServerPassword)
})
