const algosdk = require('algosdk');

const signer = require(__dirname + "/../accountConfig.json");

function signTx(ntx, signerAddr) {
    if (signerAddr !== signer.accountAddr)
        throw new Error("Unknow signer");

    return ntx.signTxn(algosdk.mnemonicToSecretKey(signer.accountMnenomic).sk);
}

module.exports = {signTx}