import { bvnVersion } from "./setting"

export const redirect_assets_paths = ["fighter", "music"]

export const redirect_fz = {
    sasuke: "Sasuke",
    sakura: "Sakura",
}

export const redirect_fighter = {
    renji: "Renji",
    byakuya: "Byakuya",
    kakashi: "Kakashi,",
    sasuke1: "Sasuke1",
}

const _fetch = fetch
window.fetch = (input, options?) => {
    if (input instanceof Request && input.method === "GET") {
        for (const redirect_path of redirect_assets_paths) {
            if (input.url.includes(redirect_path)) {
                console.log("redirecting", bvnVersion)
                const redirected_path = input.url.replace(redirect_path, `${bvnVersion}/${redirect_path}`)
                console.log("redirecting", redirected_path)
                input = new Request(redirected_path, input)
                break
            }
        }
    }

    return _fetch(input, options)
}
