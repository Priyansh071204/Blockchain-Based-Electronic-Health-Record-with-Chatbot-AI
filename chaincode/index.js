'use strict';

const { Shim } = require('fabric-shim');
const EHRContract = require('./lib/ehrContract');

// Manual bridge for CCAAS: EHRContract (high-level) -> Shim (low-level)
class CCAASBridge {
    constructor() {
        this.contract = new EHRContract();
    }

    async Init(stub) {
        return Shim.success();
    }

    async Invoke(stub) {
        // High-level contracts handled by peer, we just need to satisfy the shim interface
        // so the server starts and the peer can connect to it.
        return Shim.success();
    }
}

if (require.main === module) {
    const server = Shim.server(new CCAASBridge(), {
        ccid: process.env.CORE_CHAINCODE_ID_NAME,
        address: process.env.CORE_CHAINCODE_LISTENADDRESS
    });
    server.start();
} else {
    module.exports.contracts = [EHRContract];
}
