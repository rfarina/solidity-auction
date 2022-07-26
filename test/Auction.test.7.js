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


    it.only("should end bid, transfer token to winner, transfer funds to seller", async () => {
        
        // capture seller beginning balance and contract balance
        const sellerBalanceBefore = parseInt(await web3.eth.getBalance(seller));
        const contractBalanceBefore = parseInt(await web3.eth.getBalance(auction.address));
        
        console.log(`Seller balance before:             ${parseInt(sellerBalanceBefore)}`)
        console.log(`Contract balance before:           ${parseInt(contractBalanceBefore)}`)
        
        const resObj = await auction.endBid();
        // Calculate cost of gas, which will be paid by msg.sender, which is the seller
        const gasCharged = await calculateGas(resObj)
        const expectedNewSellerBalance = ( parseInt(sellerBalanceBefore) + parseInt(contractBalanceBefore) ) - parseInt(gasCharged)
        
        console.log(`Expected seller balance after:     ${parseInt(expectedNewSellerBalance)}`)
        console.log(`Actual seller balance after:       ${parseInt(await web3.eth.getBalance(seller))}`)
        console.log(`Difference (s/b zero):             ${parseInt(expectedNewSellerBalance) - parseInt(await web3.eth.getBalance(seller))} `)
        console.log(`Gas charged:                       ${parseInt(gasCharged)}`)
        console.log(`\nresponse from endBid:\n          ${JSON.stringify(resObj, null, 2)}`)

        assert.equal(await auction.auctionStatus(), false)
        assert.equal(parseInt(expectedNewSellerBalance), parseInt(await web3.eth.getBalance(seller)) );
        assert.equal(await nft.ownerOf(await auction.nftId()), bidder4, "Bidder 4 is now the new owner of nftId 777")
    })

})
