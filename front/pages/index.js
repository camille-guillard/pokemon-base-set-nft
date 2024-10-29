import Image from "next/image"
import { useRouter } from "next/router"

export default function Home() {
    const router = useRouter()
    return (
        <main className="w-screen flex justify-center items-center">
            <div className="my-32 mx-32 flex justify-around w-full">
                <div className="mx-12 my-12">
                    <h1 className="text-white text-3xl font-bold">Pokemon Base Set</h1>
                    <h3 className="text-white text-xl font-bold pt-8">
                        Put the power in your hand with the Pokémon trading card game! 
                    </h3>
                    <h3 className="text-white text-xl font-bold py-2">
                        The hugely successful Pokémon Game Boy® game was just the beginning of the Pokémon phenomenon. Now, with the trading card game, you can train your favorite Pokémon to pit them against a rival's Pokémon in a fight to the finish! Increase their powers with Energy, and your Pokémon will launch the special attacks you've seen in the popular Pokémon animated TV show! {" "}
                    </h3>
                    <h3 className="text-white text-xl font-bold py-2">
                        Choose your favorite Pokémon from the random cards in this booster pack to customize a Pokémon theme deck or starter set. Or design your own undefeatable deck by combining prized Pokémon and trainers. The possibilities are endless! {" "}
                    </h3>
                    <h3 className="text-white text-xl font-bold pb-8">
                        Do you have the skills to become the world's number-one Pokémon Master? Master the Pokémon trading card game and find out!
                    </h3>
                    <div>
                        <button
                            className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-auto"
                            onClick={async function () {
                                router.push("/presale")
                            }}
                        >
                            <h1 className="text-white text-xl font-bold">Allowlist Sales</h1>
                        </button>
                        <button
                            className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-8"
                            onClick={async function () {
                                router.push("/mint")
                            }}
                        >
                            <h1 className="text-white text-xl font-bold">Public Sales</h1>
                        </button>
                    </div>
                </div>
                <Image src="/assets/images/image8.jpg" width={900} height={1200} />
            </div>
        </main>
    )
}
