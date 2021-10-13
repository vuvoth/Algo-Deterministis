const algosdk = require('algosdk')

const { signTx } = require('./src/sign');

// token
const algodToken = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const algodServer = 'http://localhost';
const algodPort = 4001;

let algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

async function balanceOf(accountAddr) {
    const accountInfo = await algodClient.accountInformation(accountAddr).do()
    return accountInfo.amount;
}

const waitForConfirmation = async function (algodClient, txId, timeout) {
    if (algodClient == null || txId == null || timeout < 0) {
        throw new Error("Bad arguments");
    }

    const status = (await algodClient.status().do());
    if (status === undefined) {
        throw new Error("Unable to get node status");
    }

    const startround = status["last-round"] + 1;
    let currentround = startround;

    while (currentround < (startround + timeout)) {
        const pendingInfo = await algodClient.pendingTransactionInformation(txId).do();
        if (pendingInfo !== undefined) {
            if (pendingInfo["confirmed-round"] !== null && pendingInfo["confirmed-round"] > 0) {
                //Got the completed Transaction
                return pendingInfo;
            } else {
                if (pendingInfo["pool-error"] != null && pendingInfo["pool-error"].length > 0) {
                    // If there was a pool error, then the transaction has been rejected!
                    throw new Error("Transaction " + txId + " rejected - pool error: " + pendingInfo["pool-error"]);
                }
            }
        }
        await algodClient.statusAfterBlock(currentround).do();
        currentround++;
    }
    throw new Error("Transaction " + txId + " not confirmed after " + timeout + " rounds!");
};

async function sendAsset(sender, receiver, amount, message) {
    try {
        console.log(`Amount of sender before = ${await balanceOf(sender)}`)
        console.log(`Amount of receiver before = ${await balanceOf(receiver)}`);

        let params = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;

        const enc = new TextEncoder();
        const note = enc.encode(message);
        let txn = algosdk.makePaymentTxnWithSuggestedParams(sender, receiver, amount, undefined, note, params);

        let signedTxn = signTx(txn, sender);
        let txId = txn.txID().toString();
        console.log("Signed transaction with txID: %s", txId);

        await algodClient.sendRawTransaction(signedTxn).do();

        // Wait for confirmation
        let confirmedTxn = await waitForConfirmation(algodClient, txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        // let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
        // console.log("Transaction information: %o", mytxinfo);
        var string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
        console.log("Note field: ", string);

        console.log(`Amount of sender after = ${await balanceOf(sender)}`)
        console.log(`Amount of receiver after = ${await balanceOf(receiver)}`);
    } catch (err) {
        console.log("err = ", err);
    }
}

async function main() {
    const sender = "ER7GLR5SB34UZKLJCTDLSK3IL75SWUDJIY6FOIHTWXISIHCZRQNQPW5QDY";
    const receiver = "LODQHB7VEOPRVREINNJ2BDZDLTEY7U3JJULNKZ7KAA7DON5WBGXPLS3SXY";
    await sendAsset(sender, receiver, 100000, "First transaction");
}

main()
