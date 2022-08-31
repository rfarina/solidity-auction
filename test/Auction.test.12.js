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

    // Make bid that surpasses current bid
    // - should return funds immediately for previous high bid
    // - should increase contract's balance by bid amount
    // Make legitimate bid
    it.only("should place a higher bid, which is accepted", async () => {
        let priorBidder = bidder1
        let priorBid = await web3.utils.toWei("2.0", "ether")
        let bidder = bidder2
        let bid = await web3.utils.toWei("2.5", "ether")

        // Place a bid
        const resObj = await auction.bid({ from: bidder, value: bid });
        // console.log(`response from legitimate higher bid:\n ${JSON.stringify(resObj, null, 2)}`)


        // log[0] previous bid returned
        // console.log(`Losing bid returned event: ${resObj.receipt.logs[0].event}`)
        // console.log(`Losing bid returned address: ${resObj.receipt.logs[0].args["returnedTo"]}`)
        // console.log(`Losing bid returned amount: ${resObj.receipt.logs[0].args["amount"]}`)
        assert.equal(resObj.receipt.logs[0].event, "PreviousHighBidReturned")
        assert.equal(resObj.receipt.logs[0].args["returnedTo"], priorBidder)
        assert.equal(parseInt(resObj.receipt.logs[0].args["amount"]), priorBid)


        // log[1] event Bid accepted
        // console.log(`Bid accepted event: ${resObj.receipt.logs[1].event}`)
        // console.log(`Bid accepted address: ${resObj.receipt.logs[1].args["bidder"]}`)
        // console.log(`Bid accepted amount: ${resObj.receipt.logs[1].args["amount"]}`)
        assert.equal(resObj.receipt.logs[1].event, "BidAccepted")
        assert.equal(resObj.receipt.logs[1].args["bidder"], bidder)
        assert.equal(parseInt(resObj.receipt.logs[1].args["amount"]), bid)

        // Contract balance s/b = accepted bid amount
        const contractBal = await web3.eth.getBalance(auction.address)
        // console.log(`Auction contract new balance: ${contractBal}`)
        assert.equal(parseInt(contractBal), parseInt(bid))
    })
})
