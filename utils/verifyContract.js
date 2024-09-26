const { run } = require("hardhat")

const verifyContract = async (contractAddress, constructorArgs) => {
    console.log("Verifying Contract ...")
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArgs,
        })
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log(error.message)
        } else {
            console.log(error)
        }
    }
}

module.exports = {
    verifyContract,
}
