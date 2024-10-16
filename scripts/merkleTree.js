const keccak256 = require("keccak256");
const { default: MerkleTree } = require("merkletreejs");
const fs = require("fs");
const  { address } = require("../config/registeredAddressForWhitelist");

//  Hashing All Leaf Individual
//leaves is an array of hashed addresses (leaves of the Merkle Tree).
const leaves = address.map((leaf) => keccak256(leaf));

// Constructing Merkle Tree
const tree = new MerkleTree(leaves, keccak256, {
  sortPairs: true,
});

//  Utility Function to Convert From Buffer to Hex
const bufferToHex = (x) => "0x" + x.toString("hex");

// Get Root of Merkle Tree
console.log(`Here is Root Hash: ${bufferToHex(tree.getRoot())}`);

let data = [];

// Pushing all the proof and leaf in data array
address.forEach((address) => {
    const leaf = keccak256(address);
  
    const proof = tree.getProof(leaf);
  
    let tempData = [];
  
    proof.map((x) => tempData.push(bufferToHex(x.data)));
  
    data.push({
      address: address,
      leaf: bufferToHex(leaf),
      proof: tempData,
    });
  });
  
  // Create WhiteList Object to write JSON file
  
  let whiteList = {
    whiteList: data,
  };
  
  //  Stringify whiteList object and formating
  const metadata = JSON.stringify(whiteList, null, 2);
  
  // Write whiteList.json file in root dir
  fs.writeFile(`whiteList.json`, metadata, (err) => {
    if (err) {
      throw err;
    }
  });
  