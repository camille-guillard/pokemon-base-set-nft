import Image from "next/image"
import { useMoralis } from "react-moralis"
import { pokemonBaseSetAbi, pokemonBaseSetAddress } from "../constants/pokemon-base-set-constant"
import { useWeb3Contract } from "react-moralis"
import { useNotification } from "@web3uikit/core"
import { useEffect, useState } from "react"
import Countdown from "react-countdown"

export default function Presale() {
    const { chainId: chainIdHex, isWeb3Enabled, account } = useMoralis()
    const chainId = parseInt(chainIdHex)
    const pokemonBaseSetContractAddress = chainId in pokemonBaseSetAddress ? pokemonBaseSetAddress[chainId][0] : null
    const dispatch = useNotification()
    const [totalSupply, setTotalSupply] = useState("0")
    const [mintPrice, setMintPrice] = useState(null)
    const [maxBooster, setMaxBooster] = useState("100")
    const [isSoldOut, setIsSoldOut] = useState(false)
    const [presaleSalesStartTime, setPresaleSalesStartTime] = useState(null)
    const [presaleSalesEndTime, setPresaleSalesEndTime] = useState(null)
    const [numberOfUnopenedBoosters, setNumberOfUnopenedBoosters] = useState("0")
    const [rollInProgress, setRollInProgress] = useState(false)
    const [isLoadingPresaleProcess, setIsLoadingPresaleProcess] = useState(false)
    const [isLoadingOpenBooster, setIsLoadingOpenBooster] = useState(false)
    const [isSaleActive, setIsSaleActive] = useState(false)
    const [isAllAllowMinted, setIsAllAllowMinted] = useState(false)
    const [presaleListMax, setPresaleListMax] = useState("0")
    const [presaleListClaimed, setPresaleListClaimed] = useState("0")
    const [proof1, setProof1] = useState(null);
    const [proof2, setProof2] = useState(null);


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

    const { runContractFunction: getPresaleStartTime } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "preSalesStartTime",
        params: {},
    })

    const { runContractFunction: getPresaleEndTime } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "preSalesEndTime",
        params: {},
    })

    const { runContractFunction: getMintPrice } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "boosterPrice",
        params: {},
    })

    const { runContractFunction: getPresaleListClaimed } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "preSalesListClaimed",
        params: { "": account },
    })

    const { runContractFunction: getPresaleListMax } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "preSalesListMax",
        params: {},
    })

    const { runContractFunction: presale } = useWeb3Contract({
        abi: pokemonBaseSetAbi,
        contractAddress: pokemonBaseSetContractAddress,
        functionName: "preSaleBuyBooster",
        params: { proof: [proof1, proof2], _number: "1" },
        msgValue: mintPrice,
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
        const presaleStartTimeFromContract = (
            await getPresaleStartTime({
                onError: (error) => console.log(error),
            })
        ).toString()
        const presaleEndTimeFromContract = (
            await getPresaleEndTime({
                onError: (error) => console.log(error),
            })
        ).toString()
        const mintPriceFromContract = (
            await getMintPrice({
                onError: (error) => console.log(error),
            })
        ).toString()
        const presaleListMaxFromContract = (
            await getPresaleListMax({
                onError: (error) => console.log(error),
            })
        ).toString()
        const presaleListClaimedFromContract = (
            await getPresaleListClaimed({
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
        setTotalSupply(totalSupplyFromContract);
        setMaxBooster(maxBoosterFromContract);
        setNumberOfUnopenedBoosters(numberOfUnopenedBoosters)
        setRollInProgress(roolInProgressFromContract)
        setPresaleSalesStartTime(presaleStartTimeFromContract);
        setPresaleSalesEndTime(presaleEndTimeFromContract);
        setMintPrice(mintPriceFromContract);
        setIsSoldOut(maxBoosterFromContract - totalSupplyFromContract > 0);
        setIsSaleActive(new Date().getTime() <= presaleEndTimeFromContract);
        setIsAllAllowMinted(presaleListMaxFromContract - presaleListClaimedFromContract <= 0);
        setPresaleListMax(presaleListMaxFromContract);
        setPresaleListClaimed(presaleListClaimedFromContract);
    }

    const handleSuccess = async (tx, message, title) => {
        await tx.wait(1)
        handleNotification(message, title, "info")
        updateInfo()
        setIsLoadingPresaleProcess(false)
        setIsLoadingOpenBooster(false)
    }

    const handleFailed = async (message, title) => {
        handleNotification(message, title, "error")
        updateInfo()
        setIsLoadingPresaleProcess(false)
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
        if (completed) {

            const validationButtonStyle = {
                marginTop: "50px",
                position: "absolute",
                top: "100%",
                left: "41%",
            };

            const imgStyle = {
                display: "block",
                margin: "auto"
            };

            const inputStyle = {
                color: "black",
                width: "550px",
                textAlign: "right"
            };

            setInterval(async ()=>{
                const isRollInProgress = await isRoolInProgress();
                console.log(isRollInProgress);
                setRollInProgress(isRollInProgress);
            }, 5000);

            return (
                <div className="flex flex-col justify-center items-center text-white my-10">
                    <div className="flex justify-around w-full">
                        <div>
                            <Image src="/assets/images/image1.jpg" width={658} height={211} />

                            <h1 className="text-white text-3xl font-bold mt-8 text-center">
                                Booster available for presale : {presaleListClaimed} / {presaleListMax}
                            </h1>
                            {isAllAllowMinted ? (
                                    <h1 className="text-white text-3xl font-bold mt-8 text-center">
                                        You minted already all your spots!
                                    </h1>
                            ) : (
                                    <div>
                                        {isSoldOut ? (
                                            <div className="relative">
                                                <h2 className="my-5 justify-center text-white">Proof1 : <input type="text" style={inputStyle} name="proof1" value={proof1} onChange={e => setProof1(e.target.value)} /></h2>
                                                <h2 className="my-5 justify-center text-white">Proof2 : <input type="text" style={inputStyle} name="proof2" value={proof2} onChange={e => setProof2(e.target.value)} /></h2>
                                                <button style={validationButtonStyle}
                                                    className="bg-pink-500 hover:bg-pink-600 text-white font-bold rounded px-8 py-2 ml-auto"
                                                    disabled={isLoadingPresaleProcess}
                                                    onClick={async function () {
                                                        setIsLoadingPresaleProcess(true)
                                                        await presale({
                                                            onSuccess: async (tx) =>
                                                                await handleSuccess(tx, "Minted Successfully!", "Information"),
                                                            onError: async (err) => {
                                                                await handleFailed(err.message ? err.message : err, "Error")
                                                            },
                                                        })
                                                    }}
                                                >
                                                    {isLoadingPresaleProcess ? (
                                                        <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
                                                    ) : (
                                                        <h1 className="text-white text-xl font-bold">Mint</h1>
                                                    )}
                                                </button>
                                            </div>
                                        ) : (
                                            <h1 className="text-white text-3xl font-bold mt-8 text-center">Sold out!</h1>
                                        )}
                                    </div>
                            )}
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
            {isWeb3Enabled && presaleSalesStartTime && presaleSalesEndTime && mintPrice ? (
                <>
                    <h1 className="text-white text-3xl font-bold my-8">Presale Page</h1>
                    <h1 className="text-white text-3xl font-bold mt-8">
                        Total Supply : {totalSupply} / {maxBooster}
                    </h1>
                    <div className="my-8">
                        {isSaleActive ? (
                            <Countdown
                                date={new Date(presaleSalesStartTime)}
                                renderer={counterRenderer}
                                zeroPadDays={2}
                                zeroPadTime={2}
                            />
                        ) : (
                            <div>
                                <Image src="/assets/images/image1.jpg" width={1053} height={566} />
                                <h1 className="text-white text-3xl font-bold mt-8 text-center">Pre-Sale is over!</h1>
                            </div>
                            
                        )}
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
