import "@/styles/globals.css"
import { NotificationProvider } from "@web3uikit/core"
import Head from "next/head"
import { MoralisProvider } from "react-moralis"
import Header from "../components/Header"

export default function App({ Component, pageProps }) {
    return (
        <div className="bg-black h-screen w-full">
            <Head>
                <title>Pokemon Base Set</title>
                <meta name="description" content="Pokemon Base Set NFT Collection" />
            </Head>
            <NotificationProvider>
                <MoralisProvider initializeOnMount={false}>
                    <Header />
                    <Component {...pageProps} />
                </MoralisProvider>
            </NotificationProvider>
        </div>
    )
}
