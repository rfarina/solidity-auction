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


    it.only("should reference deployed Nft contract", async () => {
        assert(nft, !undefined)
    })

    it.only("should reference deployed Auction contract", async () => {
        assert(auction, !undefined)
        const nftId = await auction.nftId()
        // console.log(`nftId: ${nftId.toNumber()}`)
        assert.equal(await auction.nftId(), 777)
    })
})

    })

    // Make legitimate first bid
    it.only("should place first bid, confirm eoa and contract balances", async () => {
        let bidder = bidder1
        let bid = await web3.utils.toWei("2.0", "ether")

        const bidderBalanceBefore = parseInt(await web3.eth.getBalance(bidder));

        // Place a bid
        const resObj = await auction.bid({ from: bidder, value: bid });
        const bidderBalanceAfter = parseInt(await web3.eth.getBalance(bidder));

        
        // Calculate cost of gas, which will be paid by msg.sender, which is the bidder
        const gasCharged = await calculateGas(resObj)
        // console.log("***************************************************************")
        // console.log(`Bidder balance b4:                 ${parseInt(bidderBalanceBefore)}`)
        // console.log(`Bidder balance aft:                ${parseInt(bidderBalanceAfter)}`)
        // console.log(`Bidder balance aft + bid + gas :   ${parseInt(bidderBalanceAfter) + parseInt(bid) + parseInt(gasCharged)}`)
        // console.log("***************************************************************")

        // console.log(`response from legitimate higher bid:\n ${JSON.stringify(resObj, null, 2)}`)

        // log[0] event Bid accepted
        // console.log(`Bid accepted event: ${resObj.receipt.logs[0].event}`)
        // console.log(`Bid accepted address: ${resObj.receipt.logs[0].args["bidder"]}`)
        // console.log(`Bid accepted amount: ${resObj.receipt.logs[0].args["amount"]}`)

        assert.equal(resObj.receipt.logs[0].event, "BidAccepted")
        assert.equal(resObj.receipt.logs[0].args["bidder"], bidder)
        assert.equal(parseInt(resObj.receipt.logs[0].args["amount"]), bid)
        assert.equal(await web3.eth.getBalance(bidder), parseInt(bidderBalanceBefore) - parseInt(bid) - parseInt(gasCharged))

        // Contract balance s/b = accepted bid amount
        const contractBal = await web3.eth.getBalance(auction.address)
        assert.equal(parseInt(contractBal), parseInt(bid))
    })
})
