# **Base Web3 Project**

This is a basic starter project to help you set up a Solidity development environment using Hardhat. Hardhat is a development environment to compile, deploy, test, and debug your Ethereum software. With Hardhat, you can create and deploy smart contracts, build dApps, and run automated tests for your smart contracts.

## **Prerequisites**

To use this repository, you will need:

-   Node Js >= 16.14.2
-   Yarn >= 1.22.19 or npm >= 8.5.0
-   A blockchain development environment Hardhat

## **Installation**

1. Clone this repository to your local machine.
2. Install the required dependencies using `npm install` or `yarn`.

## **Usage**

To use this starter project, follow these steps:

1. Configure your Hardhat network in the `hardhat.config.js` file. You can choose to use the built-in Hardhat network, or connect to an external network such as Goerli or Mainnet.

2. Write your Solidity contracts in the `contracts/` directory.

3. Write your tests in the test/ directory. You can use the chai and mocha libraries to write your tests.

4. Compile your contracts using the following command: `npx hardhat compile`

5. Deploy your contracts to the blockchain using the following command: `npx hardhat deploy --network goerli`
   Replace goerli with the name of the network you want to deploy to.

6. Interact with your contracts using the Hardhat console or the `ethers.js` library.

## **License**

This project is licensed under the MIT License.

## **Contributing**

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change. Please make sure to update tests as appropriate.
