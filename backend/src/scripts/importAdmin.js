'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const walletPath = path.join(__dirname, '../../wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const mspPath = path.resolve(__dirname, '../../../fabric-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp');
        
        const certPath = path.join(mspPath, 'signcerts/Admin@org1.example.com-cert.pem');
        const cert = fs.readFileSync(certPath).toString();

        const keystorePath = path.join(mspPath, 'keystore');
        const files = fs.readdirSync(keystorePath);
        const keyPath = path.join(keystorePath, files[0]);
        const key = fs.readFileSync(keyPath).toString();

        const identity = {
            credentials: {
                certificate: cert,
                privateKey: key,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('admin', identity);
        console.log('Successfully imported pre-generated admin identity into the wallet');

    } catch (error) {
        console.error(`Failed to import admin identity: ${error}`);
        process.exit(1);
    }
}

main();
