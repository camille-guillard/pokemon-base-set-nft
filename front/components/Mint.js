import Image from "next/image"
import { useMoralis } from "react-moralis"
import { pokemonBaseSetAbi, pokemonBaseSetAddress } from "../constants/pokemon-base-set-constant"
import { useWeb3Contract } from "react-moralis"
import { useNotification } from "@web3uikit/core"
import { useEffect, useState } from "react"
import Countdown from "react-countdown"

export default function Mint() {
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const pokemonBaseSetContractAddress = chainId in pokemonBaseSetAddress ? pokemonBaseSetAddress[chainId][0] : null
    const dispatch = useNotification()
    const [totalSupply, setTotalSupply] = useState("0")
    const [boosterPrice, setBoosterPriceFromContract] = useState(null)
    const [displayPrice, setDisplayPriceFromContract] = useState(null)
    const [maxBooster, setMaxBooster] = useState("3600000")
    const [numberOfUnopenedBoosters, setNumberOfUnopenedBoosters] = useState("0")
    const [rollInProgress, setRollInProgress] = useState(false)
    const [publicSalesStartTime, setPublicSalesStartTime] = useState(null)
    const [isLoadingBuyBooster, setIsLoadingBuyBooster] = useState(false)
    const [isLoadingBuyDisplay, setIsLoadingBuyDisplay] = useState(false)
    const [isLoadingOpenBooster, setIsLoadingOpenBooster] = useState(false)
    const [isSoldOut, setIsSoldOut] = useState(false)
    const [nbBooster, setNbBooster] = useState(1);

    const { runContractFunction: getTotalSupply } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "totalSupply",
        params: {},
    })

    const { runContractFunction: getMaxSalesBooster } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "maxBoosterSales",
        params: {},
    })

    const { runContractFunction: getNumberOfUnopenedBoosters } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "numberOfUnopenedBoosters",
        params: {},
    })

    const { runContractFunction: isRoolInProgress } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "roolInProgress",
        params: {},
    })

    const { runContractFunction: getPublicStartTime } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "publicSalesStartTime",
        params: {},
    })

    const { runContractFunction: getBoosterPrice } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "boosterPrice",
        params: {},
    })

    const { runContractFunction: getDisplayPrice } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "boosterPrice",
        params: {},
    })

    const { runContractFunction: buyBooster } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "buyBooster",
        params: { _number: nbBooster },
        msgValue: boosterPrice * nbBooster,
    })

    const { runContractFunction: buyDisplay } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "buyDisplay",
        params: { _number: "1" },
        msgValue: displayPrice,
    })

    const { runContractFunction: openBooster } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "openBooster",
        params: { }
    })

    async function updateInfo() {
        const totalSupplyFromContract = (
            await getTotalSupply({
                onError: (error) => console.log(error),
            })
        ).toString()
        const maxBoosterFromContract = (
            await getMaxSalesBooster({
                onError: (error) => console.log(error),
            })
        ).toString()
        const numberOfUnopenedBoosters = (
            await getNumberOfUnopenedBoosters({
                onError: (error) => console.log(error),
            })
        ).toString()
        const roolInProgressFromContract = (
            await isRoolInProgress({
                onError: (error) => console.log(error),
            })
        ).toString()
        const publicStartTimeFromContract = (
            await getPublicStartTime({
                onError: (error) => console.log(error),
            })
        ).toString()
        const boosterPriceFromContract = (
            await getBoosterPrice({
                onError: (error) => console.log(error),
            })
        ).toString()
        const displayPriceFromContract = (
            await getDisplayPrice({
                onError: (error) => console.log(error),
            })
        ).toString()
        setTotalSupply(totalSupplyFromContract)
        setMaxBooster(maxBoosterFromContract)
        setNumberOfUnopenedBoosters(numberOfUnopenedBoosters)
        setRollInProgress(roolInProgressFromContract)
        setPublicSalesStartTime(publicStartTimeFromContract)
        setBoosterPriceFromContract(boosterPriceFromContract)
        setDisplayPriceFromContract(displayPriceFromContract)
        setIsSoldOut(maxBoosterFromContract - totalSupplyFromContract > 0)
    }

    const handleSuccess = async (tx, message, title) => {
        await tx.wait(1)
        handleNotification(message, title, "info")
        updateInfo()
        setIsLoadingBuyBooster(false)
        setIsLoadingBuyDisplay(false)
        setIsLoadingOpenBooster(false)
    }

    const handleFailed = async (message, title) => {
        handleNotification(message, title, "error")
        updateInfo()
        setIsLoadingBuyBooster(false)
        setIsLoadingBuyDisplay(false)
        setIsLoadingOpenBooster(false)
    }

    const handleNotification = function (message, title, type) {
        dispatch({
            type: type,
            message: message.length > 100 ? message.substring(0, 100) + "..." : message,
            title: title,
            icon: "bell",
            position: "topR",
        })
    }

    const counterRenderer = ({ days, hours, minutes, seconds, completed }) => {

        const validationButtonStyle = {
            marginTop: "50px",
            position: "absolute",
            top: "100%",
            left: "30%",
        };

        const imgStyle = {
            display: "block",
            margin: "auto"
        };

        const inputStyle = {
            color: "black",
            width: "55px",
            textAlign: "right"
        };
        
        if (completed) {
            return (
                <div className="flex flex-col justify-center items-center text-white my-10">
                    <div className="flex justify-around w-full">
                        <div className="my-5 mx-20 relative">
                            <Image style={imgStyle} src="/assets/images/image1.jpg" width={658} height={211} />

                            <div className="m-5 justify-center">
                                <h2 className="my-5 justify-center">Buy <input type="number" style={inputStyle} name="nbBooster" value={nbBooster} onChange={e => setNbBooster(e.target.value)} /> booster(s) :</h2>

                                {isSoldOut ? (
                                    <button style={validationButtonStyle}
                                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-auto"
                                        disabled={isLoadingBuyBooster}
                                        onClick={async function () {
                                            setIsLoadingBuyBooster(true)
                                            await buyBooster({
                                                onSuccess: async (tx) =>
                                                    await handleSuccess(tx, "Booster Successfully bought!", "Information"),
                                                onError: async (err) => {
                                                    await handleFailed(err.message ? err.message : err, "Error")
                                                },
                                            })
                                        }}
                                    >
                                        {isLoadingBuyBooster ? (
                                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                        ) : (
                                            <h1 className="text-white text-xl font-bold">Buy a booster</h1>
                                        )}
                                    </button>
                                ) : (
                                    <h1 className="text-white text-3xl font-bold mt-8 text-center">Sold out!</h1>
                                )}
                            </div>

                        </div>

                        <div className="my-5 mx-20 relative">
                            <Image style={imgStyle} src="/assets/images/image7.jpg" width={450} height={326} />

                            <div className="my-5 justify-center">
                                <h2 className="my-5 justify-center">1 display : 36 boosters !</h2>

                                {isSoldOut ? (
                                    <button style={validationButtonStyle}
                                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-auto"
                                        disabled={isLoadingBuyDisplay}
                                        onClick={async function () {
                                            setIsLoadingBuyDisplay(true)
                                            await buyDisplay({
                                                onSuccess: async (tx) =>
                                                    await handleSuccess(tx, "Display Successfully bought!", "Information"),
                                                onError: async (err) => {
                                                    await handleFailed(err.message ? err.message : err, "Error")
                                                },
                                            })
                                        }}
                                    >
                                        {isLoadingBuyDisplay ? (
                                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                        ) : (
                                            <h1 className="text-white text-xl font-bold">Buy a display</h1>
                                        )}
                                    </button>
                                ) : (
                                    <h1 className="text-white text-3xl font-bold mt-8 text-center">Sold out!</h1>
                                )}
                            </div>
                        
                        </div>

                        <div className="my-5 mx-20 px-20 relative">
                            <Image style={imgStyle} src="/assets/images/image9.jpg" width={168} height={233} />
                            
                            <div className="my-5 justify-center">
                                <h2 className="my-5 justify-center">Number of unopened boosters : {numberOfUnopenedBoosters}</h2>
                                {numberOfUnopenedBoosters > 0 ? (
                                    <button style={validationButtonStyle}
                                        className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-auto"
                                        disabled={ rollInProgress === 'true' || isLoadingOpenBooster}
                                        onClick={async function () {
                                            setIsLoadingOpenBooster(true)
                                            await openBooster({
                                                onSuccess: async (tx) =>
                                                    await handleSuccess(tx, "Minted Successfully!", "Information"),
                                                onError: async (err) => {
                                                    await handleFailed(err.message ? err.message : err, "Error")
                                                },
                                            })
                                        }}
                                    >
                                        { rollInProgress === 'true' || isLoadingOpenBooster ? (
                                            <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                        ) : (
                                            <h1 className="text-white text-xl font-bold">Open a booster</h1>
                                        )}
                                    </button>
                                ) : (
                                    <h1 className="text-white text-3xl font-bold mt-8 text-center"></h1>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )
        } else {
            return (
                <>
                    <h1 className="text-white text-3xl font-bold mt-8 text-center">Sales start in :</h1>
                    <h1 className="text-white text-2xl font-bold mt-8 text-center">
                        {days} Days {hours} Hours {minutes} Minutes {seconds} Seconds
                    </h1>
                </>
            )
        }
    }

    useEffect(() => {
        if (isWeb3Enabled) {
            updateInfo()
        }
    }, [isWeb3Enabled])

    return (
        <div className="flex flex-col justify-center items-center">
            {isWeb3Enabled && publicSalesStartTime && boosterPrice && displayPrice ? (
                <>
                    <h1 className="text-white text-3xl font-bold my-8">Public Sale Page</h1>
                    <h1 className="text-white text-3xl font-bold mt-8">
                        Total Supply : {totalSupply} / {maxBooster}
                    </h1>
                    <div className="my-8">
                        <Countdown
                            date={new Date(0).setUTCSeconds(publicSalesStartTime)}
                            renderer={counterRenderer}
                            zeroPadDays={2}
                            zeroPadTime={2}
                        />
                    </div>
                </>
            ) : (
                <div>
                    <h1 className="text-white text-3xl font-bold mt-32">Please Connect Wallet</h1>
                </div>
            )}
        </div>
    )
}
