### solidity-auction


## **July 2022**


# OVERVIEW

Solidity-auction is a decentralized application that allows for the minting of an Nft, and its sale via auction. To accomplish this, two contracts are required. The first, Nft.sol, will be used to mint the Nft and track its ownership. Additionally it will allow the seller to list the second contract, Auction.sol, to sell the Nft on the seller’s behalf. At the end of the auction, Auction.sol will  transfer ownership of the Nft to the buyer, and compensate the seller with the winning bid amount. Nft.sol inherits from the ERC721 OpenZeppelin contract. Auction.sol is a custom contract that provides all auction functionality. It has a reference to Nft.sol, and  implements the OpenZeppelin IERC721 Interface for token management.


# APPROACH

Auction was developed using Solidity and the Truffle Suite, and is deployed to a local Ganache Blockchain. Auction can also be deployed to the Ethereum Blockchain on Mainnet once security audits have been completed and the application is shown to be production ready.


# TESTING

All functional and unit testing was performed programmatically using Truffle, web3.js, the mocha framework and chai assertion library.

In order to be able to test in a step-by-step fashion using Auction.test.1.js, Auction.test.2.js, etc; truffle-config.js was modified to have both test and deploy network entries. By default, Truffle invokes the deployment process when running tests, which wipes out the prior contract instances to create a “clean-room” effect. 

However, to maintain the originally deployed contracts and view their current state in ganache after each individual test, a routine was created to save the original deployment addresses of Nft.sol and Auction.sol, and use them to get a reference to the existing contracts rather than re-create them.

In addition, Auction.test.js can be run in isolation to execute all tests in a single invocation to ensure they are all passing as expected.


## **Dependencies**

Node.js:[ https://nodejs.org/en/](https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqbjFpNFNQUjNCdlNZeldkUHV0MV96VW9CNEdvd3xBQ3Jtc0tsWFUyVTE2MFByV19HZmV3eXdQV2hwTXp6MU45QkJteGpKX1BoQmZDb1E4UmxmT3QxTF9CSGp0SHVQSlQzOVpkbDJFNm1vdjNOTUltQi0yYnV1MWpqLS1yWTB3ZUp3ci12ZzRCb2oydmhieS00SmxWbw&q=https%3A%2F%2Fnodejs.org%2Fen%2F) (recommended v14.16.0)

Truffle:[ https://www.trufflesuite.com/](https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqbHEtZW9IamRub1RUYVlKSkVpdWVaaWo4andLZ3xBQ3Jtc0tsT0dsQ0pJUW1IX202MlBFenZ3YWVCcUFqOFhPbFdmdGtRRmFIS2RQRWExNGRIb1hxekxNY3J3dXhCM3hMY1VPS1RlbjFnYjY4dlk0Qk8talZoWnAyNlBNeFhVdTF3b01QR1E3QmZwamxwM0VYT2hpaw&q=https%3A%2F%2Fwww.trufflesuite.com%2F) (recommended v5.5.18)

Ganache:[ https://www.trufflesuite.com/ganache](https://www.youtube.com/redirect?event=video_description&redir_token=QUFFLUhqbFdsRTJTYzNUU1lVamhxU2ZoMy13bE5oeEExQXxBQ3Jtc0tuMDF5MEpTSy1NNjZzakNJeDdtQ0Zqb0wzTjZ6UmtnVmphN2N5RndyRlNwZ1ZEM2lzZk5MeHVEbzFwYUVFZzkyeFZUV3ZJeTZIQ2Frdl9Cc095SUN6aHB3cFNLbzN4aVpYSXBJclB5VUt2aThUcUJyUQ&q=https%3A%2F%2Fwww.trufflesuite.com%2Fganache)

Metamask: [https://metamask.io/](https://metamask.io/)


## **Installation**

git clone [git@github.com](mailto:git@github.com):git@github.com:rfarina/solidity-auction.git solidity-auction

npm install -g truffle@5.5.18

npm install

Download, Install and run ganache to establish the Blockchain for local testing

[https://trufflesuite.com/ganache/](https://trufflesuite.com/ganache/)


## **Test truffle installation**

truffle version (should result in the following):

Truffle v5.5.18 (core: 5.5.18)

Ganache v7.2.0

Solidity v0.8.15 (solc-js)

Node v14.16.0

Web3.js v1.5.3


## **Compilation**

_Make sure ganache is started_

truffle compile


## **Deployment to Ganache**

truffle migrate --reset --network=deploy


## **Unit Testing - single pass**

truffle test test/Auction.test.js --network=test


## **Unit Testing - incremental testing**

truffle test test/Auction.test.1.js --network=test 

(followed by Auction.test.2.js  thru Auction.test.7.js)

**_End of Document_**
