"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("@solana-developers/helpers");
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
const bs58_1 = __importDefault(require("bs58"));
require("dotenv/config");
const rpcUrl = process.env.RPC_URL;
const connection = new web3_js_1.Connection(rpcUrl, "confirmed");
const jitoUrl = process.env.JITO_URL;
const jitoTipAccountPubkey = new web3_js_1.PublicKey(process.env.JITO_TIP_ACCOUNT_PUBKEY);
const alice = (0, helpers_1.getKeypairFromEnvironment)("ALICE_SECRET_KEY");
const bob = (0, helpers_1.getKeypairFromEnvironment)("BOB_SECRET_KEY");
function mintBobTokens() {
    return __awaiter(this, void 0, void 0, function* () {
        const mint = yield (0, spl_token_1.createMint)(connection, bob, bob.publicKey, bob.publicKey, 6);
        const bobAta = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, bob, mint, bob.publicKey);
        yield (0, spl_token_1.mintTo)(connection, bob, mint, bobAta.address, bob.publicKey, 100000);
        return mint;
    });
}
function getTransferLamportsTx(from, to, lamports, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new web3_js_1.Transaction();
        tx.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to.publicKey,
            lamports: lamports,
        }));
        tx.recentBlockhash = blockhash;
        tx.sign(from);
        return tx;
    });
}
function getTransferTokenTx(from, to, mint, amount, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new web3_js_1.Transaction();
        const fromAssociatedTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, from, mint, from.publicKey, false, "confirmed");
        const toAssociatedTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, from, mint, to.publicKey, false, "confirmed");
        tx.add((0, spl_token_1.createTransferInstruction)(fromAssociatedTokenAccount.address, toAssociatedTokenAccount.address, from.publicKey, amount));
        tx.recentBlockhash = blockhash;
        tx.sign(from);
        return tx;
    });
}
function queryJitoBundles(method, params) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.post(`${jitoUrl}/bundles`, {
                jsonrpc: "2.0",
                id: 1,
                method,
                params: [params],
            });
            return response.data;
        }
        catch (error) {
            const errorData = JSON.stringify(error.response.data);
            console.error(`Error querying Jito engine: ${errorData}`);
            return null;
        }
    });
}
function getJitoTipTransaction(from, blockhash) {
    return __awaiter(this, void 0, void 0, function* () {
        const tx = new web3_js_1.Transaction();
        tx.add(web3_js_1.SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: jitoTipAccountPubkey,
            lamports: 1000,
        }));
        tx.recentBlockhash = blockhash;
        tx.sign(from);
        return tx;
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const maxRetries = 20;
        const timeBetweenRetries = 5000;
        let retryCount = 0;
        const mint = yield mintBobTokens();
        const { blockhash } = yield connection.getLatestBlockhash();
        const aliceToBobTransferLamportsTx = yield getTransferLamportsTx(alice, bob, 0.001 * web3_js_1.LAMPORTS_PER_SOL, blockhash);
        const bobToAliceTokenTransferTx = yield getTransferTokenTx(bob, alice, mint, 100, blockhash);
        const jitoTipTx = yield getJitoTipTransaction(alice, blockhash);
        const bunldeSentResult = yield queryJitoBundles("sendBundle", [
            bs58_1.default.encode(aliceToBobTransferLamportsTx.serialize()),
            bs58_1.default.encode(bobToAliceTokenTransferTx.serialize()),
            bs58_1.default.encode(jitoTipTx.serialize()),
        ]);
        console.log(`✅ Bundle sent: ${bunldeSentResult === null || bunldeSentResult === void 0 ? void 0 : bunldeSentResult.result}`);
        do {
            const inflightBundleStatus = yield queryJitoBundles("getInflightBundleStatuses", [bunldeSentResult === null || bunldeSentResult === void 0 ? void 0 : bunldeSentResult.result]);
            const bundleStatus = (_a = inflightBundleStatus === null || inflightBundleStatus === void 0 ? void 0 : inflightBundleStatus.result.value) === null || _a === void 0 ? void 0 : _a[0].status;
            if (bundleStatus === "Failed") {
                console.log("❌ JITO bundle failed");
                return;
            }
            if (bundleStatus === "Landed") {
                console.log("✅ JITO bundle landed");
                const bundle = yield queryJitoBundles("getBundleStatuses", [
                    bunldeSentResult === null || bunldeSentResult === void 0 ? void 0 : bunldeSentResult.result,
                ]);
                console.log(`📝 Transactions: ${(_b = bundle === null || bundle === void 0 ? void 0 : bundle.result.value) === null || _b === void 0 ? void 0 : _b[0].transactions}`);
                return;
            }
            console.log(`🔄 JITO bundle status: ${bundleStatus}`);
            retryCount++;
            yield new Promise((resolve) => setTimeout(resolve, timeBetweenRetries));
        } while (retryCount < maxRetries);
    });
}
main();
