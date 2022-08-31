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


    it.only("should approve auction contract for token ownership transfer", async () => {
        const resObj = await nft.approve(auction.address, await auction.nftId(), { from: seller })

        // console.log(`Response from nft.approve response\n ${JSON.stringify(resObj,null,2)}`)
        // console.log(`Response from nft.approve event\n ${(resObj.receipt.logs[0].event)}`)
        // console.log(`Response from nft.approve approved owner\n ${ (resObj.receipt.logs[0].args["owner"])}`)
        // console.log(`Response from nft.approve approved address\n ${ (resObj.receipt.logs[0].args["approved"])}`)
        // console.log(`Response from nft.approve approved tokenId\n ${ parseInt(resObj.receipt.logs[0].args["tokenId"]) }`)

        // Evaluate returned Approval Event, confirming nft.approve() success
        assert.equal((resObj.receipt.logs[0].event), "Approval")
        assert.equal((resObj.receipt.logs[0].args["owner"]), seller)
        assert.equal((resObj.receipt.logs[0].args["approved"]), auction.address)
        assert.equal(parseInt(resObj.receipt.logs[0].args["tokenId"]), await auction.nftId())

    })

})
