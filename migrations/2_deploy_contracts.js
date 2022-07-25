const Nft = artifacts.require("Nft")
const Auction = artifacts.require("Auction")
const { writeFileSync } = require("fs")
const path = "./deployedAddresses.json"

module.exports = async function (deployer, network, accounts) {
    // The following allows us to keep the initial instance of each contract
    if (network == "test") { return }  // test will deploy its own

    // Deploy nft
    console.log("\nDeploy Nft and Auction Contracts (2_deploy_contracts.js)")
    
    await deployer.deploy(Nft)
    const nft = await Nft.deployed()
    console.log(`nft.address:       ${nft.address}`)

    const nftId = 777
    // await nft.mint(deployer, nftId);  // mint the nft // causes error during deploy

    // Deploy Auction (note there are 3 params)
    await deployer.deploy(Auction, nft.address, nftId)
    const auction = await Auction.deployed()
    console.log(`auction.address:   ${auction.address}`)

    const addresses = {
        nft: nft.address,
        auction: auction.address
    }

    // Capture nft and auction addresses, which will be read in by the test process
    writeFileSync(path, JSON.stringify(addresses,null,2), "utf-8")
}
