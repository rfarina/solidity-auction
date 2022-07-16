/*
    To get the gas cost, we need to first extract the following:
    *   gasUsed from the transaction receipt
    *   gasPrice from getTransaction() using receipt.tx
    * 
    Now calculate gasCost
    *   gasCost = gasUsed * gasPrice
    *   Note: use of toBN to maintain precision while performing calcs
*/
it("should place a bid for accounts[1]", async () => {
    // Obtain gas used from the receipt
    receipt = await auction.bid({from: accounts[1], value: web3.utils.toWei("2.0", "ether")});
    const gasUsed = toBN(receipt.receipt.gasUsed);
    console.log(`Gas used: ${gasUsed}`)

    // Obtain gas price from the Tx
    const tx = await web3.eth.getTransaction(receipt.tx);
    const gasPrice = toBN(tx.gasPrice);
    console.log(`Gas price: ${gasPrice}`);

    // Calculate gas charged for the Tx
    gasCharged = gasPrice * gasUsed;
    console.log(`Gas charged: ${gasCharged.toString()}`)
    console.log(`Receipt of bid(): ${JSON.stringify(receipt,null,2)}`);

})


const receipt = 

{
    "tx": "0xe9592e3f39fd76786a0c07c4ac1875b1bf844060b104120952fe1d4fbfde2b0a",
    "receipt": {
      "transactionHash": "0xe9592e3f39fd76786a0c07c4ac1875b1bf844060b104120952fe1d4fbfde2b0a",
      "transactionIndex": 0,
      "blockHash": "0xd2e466f713621c89931d725f473be8e665ba2808f8872dcc52748e788ffde8a7",
      "blockNumber": 827,
      "from": "0x2523c109f14cb85f13c067fa7a38696d21a4a7f4",
      "to": "0xd2c1b7328e5c3a18f26639a0735ce98df65c9705",
      "gasUsed": 105518,
      "cumulativeGasUsed": 105518,
      "contractAddress": null,
      "logs": [
        {
          "logIndex": 0,
          "transactionIndex": 0,
          "transactionHash": "0xe9592e3f39fd76786a0c07c4ac1875b1bf844060b104120952fe1d4fbfde2b0a",
          "blockHash": "0xd2e466f713621c89931d725f473be8e665ba2808f8872dcc52748e788ffde8a7",
          "blockNumber": 827,
          "address": "0xD2c1B7328E5C3a18f26639a0735cE98df65c9705",
          "type": "mined",
          "id": "log_652a09c7",
          "event": "BidAccepted",
          "args": {
            "0": "0x2523C109f14cb85F13c067fA7a38696D21A4A7F4",
            "1": "1bc16d674ec80000",
            "2": "62be2868",
            "__length__": 3,
            "sender": "0x2523C109f14cb85F13c067fA7a38696D21A4A7F4",
            "amount": "1bc16d674ec80000",
            "bidTime": "62be2868"
          }
        }
      ],
      "status": true,
      "logsBloom": "0x00000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000",
      "rawLogs": [
        {
          "logIndex": 0,
          "transactionIndex": 0,
          "transactionHash": "0xe9592e3f39fd76786a0c07c4ac1875b1bf844060b104120952fe1d4fbfde2b0a",
          "blockHash": "0xd2e466f713621c89931d725f473be8e665ba2808f8872dcc52748e788ffde8a7",
          "blockNumber": 827,
          "address": "0xD2c1B7328E5C3a18f26639a0735cE98df65c9705",
          "data": "0x0000000000000000000000002523c109f14cb85f13c067fa7a38696d21a4a7f40000000000000000000000000000000000000000000000001bc16d674ec800000000000000000000000000000000000000000000000000000000000062be2868",
          "topics": [
            "0x90c92f2d4052ed516f2beb1265c36e62af39eb7aaa59cb7595335ce67dc8b96c"
          ],
          "type": "mined",
          "id": "log_652a09c7"
        }
      ]
    },
    "logs": [
      {
        "logIndex": 0,
        "transactionIndex": 0,
        "transactionHash": "0xe9592e3f39fd76786a0c07c4ac1875b1bf844060b104120952fe1d4fbfde2b0a",
        "blockHash": "0xd2e466f713621c89931d725f473be8e665ba2808f8872dcc52748e788ffde8a7",
        "blockNumber": 827,
        "address": "0xD2c1B7328E5C3a18f26639a0735cE98df65c9705",
        "type": "mined",
        "id": "log_652a09c7",
        "event": "BidAccepted",
        "args": {
          "0": "0x2523C109f14cb85F13c067fA7a38696D21A4A7F4",
          "1": "1bc16d674ec80000",
          "2": "62be2868",
          "__length__": 3,
          "sender": "0x2523C109f14cb85F13c067fA7a38696D21A4A7F4",
          "amount": "1bc16d674ec80000",
          "bidTime": "62be2868"
        }
      }
    ]
  }
    