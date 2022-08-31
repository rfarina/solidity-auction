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

    it.only("should mint an nft 777 to seller", async () => {
        await nft.mint(seller, 777)
        assert.equal(await nft.ownerOf(await auction.nftId()), await auction.seller())
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

    it.only("should show auction contract as approved address for token", async () => {
        // console.log(`approved address: ${await nft.getApproved(await auction.nftId())}`)
        assert.equal(await nft.getApproved(await auction.nftId()), auction.address)
    })

    it.only("should show seller is still owner", async () => {
        // console.log(`current token owner: ${await nft.ownerOf(await auction.nftId())}`)
        // console.log(`seller: ${seller}`)
        assert.equal(await nft.ownerOf(await auction.nftId()), seller)
    })

    // Start Auction here
    it.only("should start the auction", async () => {
        const resObj = await auction.start(startingBid, auctionDuration)
        // console.log(`auction.start response:\n ${JSON.stringify(resObj,null,2)}`)
        // console.log(`auction.start startingBid:\n ${parseInt(resObj.receipt.logs[0].args["startingBid"])}`)
        // console.log(`auction.start duration:\n ${parseInt(resObj.receipt.logs[0].args["duration"])}`)

        assert.equal(resObj.receipt.logs[0].event, "Start")
        assert.equal(parseInt(resObj.receipt.logs[0].args["startingBid"]), startingBid)
        assert.equal(parseInt(resObj.receipt.logs[0].args["duration"]), auctionDuration)
        assert.equal(await auction.auctionActive(), true)
        assert.isTrue(await auction.auctionActive())
    })

    it.only("should show highest bidder as address(0)", async () => {
        // console.log(`highest bidder after auction start: ${await auction.highestBidder()}`)
        assert.equal(await auction.highestBidder(), "0x0000000000000000000000000000000000000000")
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

    it.only("should fail on placing low bid", async () => {
        let bidder = bidder2
        let bid = await web3.utils.toWei("1.5", "ether")

        // This "low bid" should be rejected
        await expect(
            auction.bid({ from: bidder, value: bid })
        ).to.be.rejected
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

    it.only("should place a higher bid, which is accepted", async () => {
        let priorBidder = bidder2
        let priorBid = await web3.utils.toWei("2.5", "ether")
        let bidder = bidder3
        let bid = await web3.utils.toWei("3.0", "ether")

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

    it.only("should place another higher bid, which is accepted", async () => {

        let priorBidder = bidder3
        let priorBid = await web3.utils.toWei("3.0", "ether")
        let bidder = bidder4
        let bid = await web3.utils.toWei("3.5", "ether")

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

    it.only("should end auction by seller, transfer token to winner, transfer funds to seller", async () => {
        let bidder = bidder4
        
        // capture seller, bidder, beginning balance and contract balance
        const sellerBalanceBefore = parseInt(await web3.eth.getBalance(seller));
        const winningBidderBalanceBefore = parseInt(await web3.eth.getBalance(bidder));
        const contractBalanceBefore = parseInt(await web3.eth.getBalance(auction.address));
        
        // console.log(`Seller balance before:             ${parseInt(sellerBalanceBefore)}`)
        // console.log(`Contract balance before:           ${parseInt(contractBalanceBefore)}`)
        
        const resObj = await auction.endAuction();
        // Calculate cost of gas, which will be paid by msg.sender, which is the seller
        const gasCharged = await calculateGas(resObj)
        const expectedNewSellerBalance = ( parseInt(sellerBalanceBefore) + parseInt(contractBalanceBefore) ) - parseInt(gasCharged)
        const winningBidderBalanceAfter = parseInt(await web3.eth.getBalance(bidder));
        
        console.log(`Expected seller balance after:     ${parseInt(expectedNewSellerBalance)}`)
        console.log(`Actual seller balance after:       ${parseInt(await web3.eth.getBalance(seller))}`)
        console.log(`Difference (s/b zero):             ${parseInt(expectedNewSellerBalance) - parseInt(await web3.eth.getBalance(seller))} `)
        console.log(`Gas charged:                       ${parseInt(gasCharged)}`)
        console.log(`\nresponse from endBid:\n          ${JSON.stringify(resObj, null, 2)}`)

        console.log(`Winning bidder balance before:     ${parseInt(winningBidderBalanceBefore)}`)
        console.log(`Winning bidder balance after:      ${parseInt(winningBidderBalanceAfter)}`)



        assert.equal(await auction.auctionStatus(), false)
        assert.equal(parseInt(await web3.eth.getBalance(seller)), parseInt(expectedNewSellerBalance) );
        assert.equal(await nft.ownerOf(await auction.nftId()), bidder4, "Bidder 4 is now the new owner of nftId 777")
    })

    it.only("should return list of all bids", async () => {
        const bids = await auction.listBids()
        console.log(`Bids array:\n `)
        for (let i=0; i<bids.length; i++) {

            console.log(`${bids[i]}`)
        }
    })

})
