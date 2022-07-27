// SPDX-License-Identifier: MIT
pragma solidity 0.8.15;

interface IERC721 {
    function transferFrom(
        address from,
        address to,
        uint256 nftId
    ) external;
}

contract Auction {
    IERC721 public immutable nft;
    uint256 public immutable nftId;

    address payable public seller;
    uint256 public startingBid;
    uint256 public currentBid;
    uint256 public auctionEndTime;
    address payable public highestBidder;
    bool public auctionActive;

    mapping(address => uint256) public bidderToBid;

    Bid[] public bids;

    struct Bid {
        address bidder;
        uint256 bid;
        uint256 timeStamp;
    }

    error InsufficientBidAmount(uint256 bidAmount, uint256 currentBid);
    error AuctionExpired(uint256 currentTime, uint256 auctionEndTime);
    error InsufficientFunds(uint256 bidAmount, uint256 currentBalance);

    event Start(uint256 startingBid, uint256 duration);
    event BidAccepted(address bidder, uint256 amount, uint256 bidTime);
    event BidNotAccepted(address bidder, uint256 amount, uint256 bidTime);

    event PreviousHighBidReturned(
        address returnedTo,
        uint256 amount,
        uint256 returnTime
    );
    event PreviousHighBidNotReturned(
        address notReturnedTo,
        uint256 amount,
        uint256 notReturnTime
    );

    event PaymentReceived(address sender, uint256 amount, string processedBy);

    event AttemptingPaymentThatWillFail(
        address sender,
        uint256 amount,
        string processedBy
    );
    event End(address winner, uint256 winningBid);

    modifier onlySeller() {
        require(msg.sender == seller, "Not seller");
        _;
    }

    modifier onlySufficientBalance(address _sender, uint256 _amount) {
        require(
            msg.sender.balance >= msg.value,
            "Payment rejected for lack of balance"
        );
        _;
    }
    modifier onlyAuctionActive() {
        require(auctionActive, "Auction has ended");
        _;
    }

    constructor(address _nft, uint256 _nftId) {
        nft = IERC721(_nft);
        nftId = _nftId;

        seller = payable(msg.sender);
    }

    function start(uint256 _startingBid, uint256 _auctionDuration)
        external
        onlySeller
    {
        require(!auctionActive, "Already Started");

        auctionActive = true;
        auctionEndTime = block.timestamp + _auctionDuration;
        startingBid = _startingBid;
        currentBid = _startingBid;

        emit Start(startingBid, _auctionDuration);
    }

    function auctionStatus() external view returns (bool) {
        return auctionActive;
    }

    /* 
        @dev 
            receive bid amount provided 
                bid is > current bid
                auction has not ended
    */
    function bid() external payable onlyAuctionActive {
        uint256 _bidAmount = msg.value;

        if (!(block.timestamp <= auctionEndTime)) {
            revert AuctionExpired({
                currentTime: block.timestamp,
                auctionEndTime: auctionEndTime
            });
        }

        if (!(_bidAmount > currentBid)) {
            revert InsufficientBidAmount({
                bidAmount: _bidAmount,
                currentBid: currentBid
            });
        }

        // Reduce prior bid liability immediately
        _returnPreviousHighBid(highestBidder, bidderToBid[highestBidder]);

        // Bid accepted
        currentBid = _bidAmount;
        highestBidder = payable(msg.sender);

        // Add to mapping
        bidderToBid[msg.sender] += _bidAmount;

        // Add to array as Struct
        bids.push(Bid(msg.sender, _bidAmount, block.timestamp));

        emit BidAccepted(msg.sender, _bidAmount, block.timestamp);
    }

    function _returnPreviousHighBid(address _priorBidder, uint256 _priorBidAmount)
        internal
    {
        // Send back previous bids to previous highest bidder if not address(0)
        if (
            highestBidder != address(0) &&
            bidderToBid[_priorBidder] >= _priorBidAmount
        ) {
            // Todo: should protect against reentrancy!!
            bool success = payable(_priorBidder).send(_priorBidAmount);
            if (!success) {
                // Do not reduce liability of the auction contract
                emit PreviousHighBidNotReturned(
                    _priorBidder,
                    _priorBidAmount,
                    block.timestamp
                );
            } else {
                // Reduce liability of the auction contract
                bidderToBid[_priorBidder] -= _priorBidAmount; // reduce bid liability (s/b zero after)
                emit PreviousHighBidReturned(
                    _priorBidder,
                    _priorBidAmount,
                    block.timestamp
                );
            }
        }
    }

    function endAuction()
        external
        onlySeller
        onlyAuctionActive
        returns (address _winner, uint256 _winningBid)
    {
        auctionActive = false;
        // _returnLosingBids(); no longer needed

        // Transfer token ownership to winning bid
        nft.transferFrom(msg.sender, highestBidder, nftId);

        // Transfer funds to seller
        bool success = payable(seller).send(address(this).balance);

        _winner = highestBidder;
        _winningBid = currentBid;

        emit End(_winner, _winningBid);
    }

    function _returnLosingBids() internal returns (bool) {
        for (uint256 i = 0; i < bids.length; i++) {
            Bid storage _bid = bids[i];
            if (_bid.bidder != highestBidder) {
                bool successfulSend = payable(_bid.bidder).send(_bid.bid);
                if (successfulSend) {
                    // Reduce amount bid by this address
                    bidderToBid[_bid.bidder] -= _bid.bid;

                    // Delete mapping if address contains 0 balance
                    if (bidderToBid[_bid.bidder] == 0) {
                        delete bidderToBid[_bid.bidder];
                        // Code to remove struct from array if it no longer valuable
                        // TBD, as it may be valuable for historical and reporting purposes
                        delete bids[i];
                    }
                }
            }
        }
        return true;
    }

    function listBids() external view returns(Bid[] memory) {
        return bids;
    }

    function senderBalance() external view returns (uint256) {
        return msg.sender.balance;
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function auctionTimeRemaining()
        external
        view
        returns (uint256 _auctionTimeRemaining, bool _auctionActive)
    {
        uint256 _currentTime = block.timestamp;
        if (auctionEndTime > _currentTime) {
            _auctionTimeRemaining = auctionEndTime - _currentTime;
            _auctionActive = true;
        } else {
            _auctionTimeRemaining = 0;
            _auctionActive = false;
        }
        return (_auctionTimeRemaining, _auctionActive);
    }

    receive() external payable onlySufficientBalance(msg.sender, msg.value) {
        emit PaymentReceived(msg.sender, msg.value, "receive function");
    }

    fallback() external payable onlySufficientBalance(msg.sender, msg.value) {
        emit PaymentReceived(msg.sender, msg.value, "fallback function");
    }
}
