const { readFileSync } = require("fs")
const path = "./deployedAddresses.json"

const { ethers } = require("ethers");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const { assert, expect } = require("chai");

const Nft = artifacts.require("Nft");
const Auction = artifacts.require("Auction");
const decimals = 18;
const startingBid = web3.utils.toWei("1.0", "ether");
const auctionDuration = "4800";
const eoaBalances = [];

const { toBN, calculateGas } = require("../shared/auction.utils")

contract("Auction", async (accounts) => {
    let nft, auction;
    const seller = accounts[0]
    const bidder1 = accounts[1]
    const bidder2 = accounts[2]
    const bidder3 = accounts[3]
    const bidder4 = accounts[4]

    before(async () => {
        // Get a reference to the contracts deployed on ganache

        console.log("\n\nAuction.test.js: Deploy Nft and Auction Contracts")

        // Get the stored contract deployed instance addresses
        const deployedAddresses = JSON.parse(readFileSync(path))
        console.log("Here is nft address:     " + deployedAddresses.nft)
        console.log("Here is auction address: " + deployedAddresses.auction)

        // Get reference to the existing nft contract instance
        // nft = await Nft.deployed()
        nft = await Nft.at(deployedAddresses.nft)
        console.log(`nft.address:       ${nft.address}`)

        // To create a new instance of the contract
        // auction = await Auction.new(nft.address, 777)   // nft contract and tokenid
        
        // For existing contract
        auction = await Auction.at(deployedAddresses.auction); 
        console.log(`auction.address:   ${auction.address}`)
        
        // Populate array of starting balances of each eoa account
        for (let i = 0; i < accounts.length; i++) {
            eoaBalances[i] = (await web3.eth.getBalance(accounts[i])).toString();
        }
        console.log(eoaBalances);
        console.log(accounts)

    })

    it.only("should fail on starting already active auction", async () => {
        // This start attempt should be rejected


        // The following will not allow for the capture of resObj, and so cannot evaluate the error
        // But, the try/catch below has flaws as well!! So, resort to "expect" (far below)
        /*
        let resObj
        resObj = await auction.start(startingBid, auctionDuration)
        console.log(`failed start: ${JSON.stringify(resObj,null,2)}`)
        */

        // The following try/catch appears to catch, but the error object is not easily stringified
        /*
        try {
            
            const resObj = await auction.start(startingBid, auctionDuration)
            
        } catch (error) {
            console.log(`Failed to start active auction response:\n ${JSON.stringify(error,null,2)}`);
            // assert.equal(error.reason, "Bid is not high enough");
        }
        */


        // This works, but cannot capture the resObj and evaluate it        
        await expect(
            auction.start(startingBid, auctionDuration)
        ).to.be.rejected

    })
})
