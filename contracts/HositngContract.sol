pragma solidity ^0.4.21;

import "./Ownable.sol";


contract HostingContract is Ownable {

    address public customer;
    uint public endTime;
    string public _hash;
    event StopContract(address _contract);

    function HostingContract(address _customer, uint _endTime, string _location) public {
        customer = _customer;
        endTime = _endTime;
        _hash = _location;
    }

    function getLocation() public onlyCustomer(customer) returns (string) {
        return _hash;
    }

    function getStatus() public view returns (bool) {
        if (now > endTime) {
            return false;
        } else {
            return true;
        }
    }

    function endTimely() public onlyOwner {
        require(now > endTime);
        emit StopContract(address(this));
        selfdestruct(this);
    }

    function endPrematurely() public onlyCustomer(customer) {
        emit StopContract(address(this));
        selfdestruct(this);
    }

}
