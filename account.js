const algosdk = require('algosdk')
const fs = require('fs');

const createAccount = ({
    exportPath
}) => {
    try {
        const account = algosdk.generateAccount();
        const accountAddr = account.addr;
        const accountMnenomic = algosdk.secretKeyToMnemonic(account.sk);
        console.log("Account Mnemoic = " + accountMnenomic);
        console.log("Account Address = " + accountAddr);
        fs.writeFileSync(exportPath, JSON.stringify({accountAddr, accountMnenomic}, null, 2));
    } catch(err) {
        console.log("err", err)
    }
}

createAccount({ exportPath : __dirname + "/other.json"});