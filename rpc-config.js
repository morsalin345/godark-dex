
const RPC_CONFIG = {
    MAINNET_NODE: "https://api.mainnet-beta.solana.com",
    COMMITMENT_LEVEL: "confirmed"
};

const getSolanaConnection = () => {
    const solanaObj = window.solanaWeb3;
    if (!solanaObj) {
        console.error("Critical: Solana Core SDK bundle not loaded fully yet.");
        return null;
    }
    return new solanaObj.Connection(RPC_CONFIG.MAINNET_NODE, RPC_CONFIG.COMMITMENT_LEVEL);
};
