// const { assert } = require("chai");
// const web3 = require("web3");  // even though provided by truffle, but causes not defined


const { readFileSync } = require("fs")
const path = "./deployedAddresses.json"

const { ethers } = require("ethers");
const chai = require("chai");
chai.use(require("chai-as-promised"));
const { assert, expect } = require("chai");
const { toBN } = web3.utils;
// const { default: Web3 } = require("web3");

// console.log("testing...");
const Nft = artifacts.require("Nft");
const Auction = artifacts.require("Auction");
const decimals = 18;
const startingBid = web3.utils.toWei("1.0", "ether");
const auctionDuration = "4800";
const eoaBalances = [];
let gasCharged;

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


    it("should reference deployed Nft contract", async () => {
        assert(nft, !undefined)
    })

    it("should reference deployed Auction contract", async () => {
        assert(auction, !undefined)
        const nftId = await auction.nftId()
        // console.log(`nftId: ${nftId.toNumber()}`)
        assert.equal(await auction.nftId(), 777)
    })

    it("should mint an nft 777 to seller", async () => {
        await nft.mint(seller, 777)
        assert.equal(await nft.ownerOf(await auction.nftId()), await auction.seller())
    })

    it("should approve auction contract for token ownership transfer", async () => {
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

    it("should show auction contract as approved address for token", async () => {
        // console.log(`approved address: ${await nft.getApproved(await auction.nftId())}`)
        assert.equal(await nft.getApproved(await auction.nftId()), auction.address)
    })

    it("should show seller is still owner", async () => {
        // console.log(`current token owner: ${await nft.ownerOf(await auction.nftId())}`)
        // console.log(`seller: ${seller}`)
        assert.equal(await nft.ownerOf(await auction.nftId()), seller)
    })

    // Start Auction here
    it("should start the auction", async () => {
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

    it("should show highest bidder as address(0)", async () => {
        // console.log(`highest bidder after auction start: ${await auction.highestBidder()}`)
        assert.equal(await auction.highestBidder(), "0x0000000000000000000000000000000000000000")
    })                                              

    it("should fail on starting already active auction", async () => {
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
    it("should place first bid and confirm contract balance", async () => {
        let bidder = bidder1
        let bid = await web3.utils.toWei("2.0", "ether")

        // Place a bid
        const resObj = await auction.bid({ from: bidder, value: bid });
        // console.log(`response from legitimate higher bid:\n ${JSON.stringify(resObj, null, 2)}`)

        // log[0] event Bid accepted
        // console.log(`Bid accepted event: ${resObj.receipt.logs[0].event}`)
        // console.log(`Bid accepted address: ${resObj.receipt.logs[0].args["bidder"]}`)
        // console.log(`Bid accepted amount: ${resObj.receipt.logs[0].args["amount"]}`)

        assert.equal(resObj.receipt.logs[0].event, "BidAccepted")
        assert.equal(resObj.receipt.logs[0].args["bidder"], bidder)
        assert.equal(parseInt(resObj.receipt.logs[0].args["amount"]), bid)

        // Contract balance s/b = accepted bid amount
        const contractBal = await web3.eth.getBalance(auction.address)
        assert.equal(parseInt(contractBal), parseInt(bid))
    })

    it("should fail on placing low bid", async () => {
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
    it("should place a higher bid, which is accepted", async () => {
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
        assert.equal(resObj.receipt.logs[0].event, "LosingBidReturned")
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
        assert.equal(resObj.receipt.logs[0].event, "LosingBidReturned")
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


    it("should place another higher bid, which is accepted", async () => {
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
        assert.equal(resObj.receipt.logs[0].event, "LosingBidReturned")
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












    // it("should confirm auction has started", async () => {
    //     assert.isTrue(await auction.auctionStatus());
    // })

    // it("should fail on re-start of started auction", async () => {
    //     await expect(

    //     )
    // })
















    it("should confirm starting bid", async () => {
        const _startingBid = await auction.startingBid();
        assert.equal(_startingBid.toString(), startingBid);
    })

    it("should fail on placing low bid", async () => {
        // Confirm current bid
        /*
        try {
            
            const response = await auction.bid({from: accounts[3], value: web3.utils.toWei("1.5", "ether")});
            
        } catch (error) {
            // console.log(`Failed bid response:\n ${JSON.toString(error,null,2)}`);
            // console.log(`Failed bid response: error.reason\n ${JSON.stringify(error,null,2)}`);
            assert.equal(error.reason, "Bid is not high enough");
        }
        */
        // This "low bid" should be rejected
        await expect(
            auction.bid({ from: accounts[3], value: web3.utils.toWei("1.5", "ether") })
        ).to.be.rejected;
    })

    it("should confirm total bids value of accounts[2]", async () => {
        // console.log(accounts);
        const response = await auction.bidderToBid(accounts[2]);
        const responseInt = parseInt((response.toString()));
        // console.log(response);
        // console.log(responseInt);
        // console.log(response.toString());
        assert.equal(response.toString(), web3.utils.toWei("2.0", "ether"));
        expect(response.toString()).to.equal(web3.utils.toWei("2.0", "ether"));
    })


    it("should place a bid for accounts[1] and confirm new eoa balance", async () => {
        /*
        To get the gas cost, we need to first extract the following:
        *   gasUsed from the transaction receipt
        *   gasPrice from getTransaction() using receipt.tx
        * 
        Now calculate gasCost
        *   gasCost = gasUsed * gasPrice
        *   Note: use of toBN to maintain precision while performing calcs
        */


        // Get balance of eoa account prior to making bid
        const balBeforeBid = await web3.eth.getBalance(accounts[1]);

        // Place bid and capture new eoa balance
        const receipt = await auction.bid({ from: accounts[1], value: web3.utils.toWei("3.0", "ether") });
        // console.log(`balBefore from getBalance: ${parseInt(balBeforeBid)}`) // 100.000000000000000000
        // console.log(`balBefore from solidity:   ${parseInt(receipt.logs[0].args[3])}`)
        const balAfterBid = await web3.eth.getBalance(accounts[1]);

        // // Obtain gas used from the receipt
        // // const { logs } = receipt;
        // // console.log(`\n\nHere are the Logs:\n ${JSON.stringify(logs,null,2)}`);

        const gasUsed = toBN(receipt.receipt.gasUsed);
        // // console.log(`Gas used:          ${gasUsed}`)

        // // Obtain gas price from the receipt.tx and capture corresponding Tx (receipt)
        const tx = await web3.eth.getTransaction(receipt.tx);
        const gasPrice = toBN(tx.gasPrice);
        // // console.log(`tx.gasPrice:       ${tx.gasPrice}`)

        // // Calculate gas charged for the Tx
        gasCharged = parseInt(gasUsed) * parseInt(gasPrice);
        // // console.log(`gasCharged:        ${parseInt(gasCharged)}`);

        // // Calculate total bid cost 
        const totalBidCost = parseInt(web3.utils.toWei("2.0", "ether")) + parseInt(gasCharged);
        const calculatedBalance = parseInt(balBeforeBid) - parseInt(totalBidCost);
        // console.log(`Calculated balance:                    ${parseInt(calculatedBalance)}`);
        // console.log(`Eoa balance after bid from ganache:    ${parseInt(balAfterBid)}`);

        assert(parseInt(calculatedBalance), parseInt(balAfterBid), "Must be equal");

        // console.log(`\nReceipt of bid():                      ${JSON.stringify(receipt,null,2)}`);
        // console.log(`\nReceipt of getTransaction(receipt.tx): ${JSON.stringify(tx,null,2)}`);


    })


})
