import { ConnectButton } from "@web3uikit/web3"
import { useRouter } from "next/router"

export default function Header() {
    const router = useRouter()
    return (
        <nav className="p-5 border-b-2 flex flex-row">
            <h1
                className="py-2 px-8 font-bold text-3xl text-white cursor-pointer"
                onClick={() => {
                    router.push("/")
                }}
            >
                Pokemon Base Set
            </h1>
            <div className="ml-auto py-2 px-4">
                <ConnectButton />
            </div>
        </nav>
    )
}
