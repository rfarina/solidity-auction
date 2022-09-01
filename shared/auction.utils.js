const { toBN } = require("web3-utils")

// async function calculateGas(resObj) {
const calculateGas = async (resObj) => {
    /*
    To get the gas cost, we need to first extract the following:
    *   gasUsed from the transaction receipt
    *   gasPrice from getTransaction() using receipt.tx
    * 
    Now calculate gasCost
    *   gasCost = gasUsed * gasPrice
    *   Note: use of toBN to maintain precision while performing calcs
    */


    // // Obtain gas used from the receipt
    // // const { logs } = receipt;
    // // console.log(`\n\nHere are the Logs:\n ${JSON.stringify(logs,null,2)}`);

    // console.log(`\n\nresObj:\n ${JSON.stringify(resObj,null,2)}`);
    const gasUsed = toBN(resObj.receipt.gasUsed);
    // console.log(`Gas used:          ${gasUsed}`)

    // Obtain gas price from the receipt.tx and capture corresponding Tx (receipt)
    const tx = await web3.eth.getTransaction(resObj.tx);
    const gasPrice = toBN(tx.gasPrice);
    // console.log(`tx.gasPrice:       ${tx.gasPrice}`)

    // // Calculate gas charged for the Tx
    const gasCharged = parseInt(gasUsed) * parseInt(gasPrice);
    // console.log(`gasCharged:        ${parseInt(gasCharged)}`);

    return parseInt(gasCharged)
}

module.exports = { toBN, calculateGas };
