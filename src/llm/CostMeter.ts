// 成本计量：累计 nano-gpt 在本次演示中"花"了多少 token / 多少次前向计算。
// 读者最关心的是"这活儿到底要花多少钱"，所以这个模块把每一步前向的真实开销记下来，
// 供左下角的成本计数器（CostMeterHud）实时显示。

export const MODEL_PARAMS = 85_000;          // nano-gpt 参数量
export const CONTEXT_WINDOW = 11;            // 上下文窗口 T = block_size
export const ASSUMED_PRICE_PER_M_TOKENS = 0.01; // 假设单价：$0.01 / 百万 token（仅用于直观感受，非真实账单，可改）

interface ICostState {
    forwardPasses: number;     // 前向计算次数（每生成/初始化一次 +1）
    tokensProcessed: number;   // 累计处理的 token 数（每次前向按当前有效上下文长度累加）
}

const state: ICostState = {
    forwardPasses: 0,
    tokensProcessed: 0,
};

const listeners = new Set<() => void>();

function notify() {
    for (let l of listeners) {
        l();
    }
}

export const costMeter = {
    get forwardPasses() { return state.forwardPasses; },
    get tokensProcessed() { return state.tokensProcessed; },

    /** 记录一次前向计算：本次处理了 `tokens` 个有效 token。 */
    addForward(tokens: number) {
        state.forwardPasses += 1;
        state.tokensProcessed += tokens;
        notify();
    },

    /** 重置（模型重新构建时调用，保证每次打开页面从 0 开始）。 */
    reset() {
        state.forwardPasses = 0;
        state.tokensProcessed = 0;
        notify();
    },

    /** 粗略的浮点运算量估算：前向 ≈ 2 × 参数量 × 处理过的 token 数。 */
    get flopsEstimate() {
        return 2 * MODEL_PARAMS * state.tokensProcessed;
    },

    /** 按假设单价换算的美元估算。 */
    get usdEstimate() {
        return (state.tokensProcessed / 1_000_000) * ASSUMED_PRICE_PER_M_TOKENS;
    },
};

export function subscribeCost(cb: () => void): () => void {
    listeners.add(cb);
    return () => { listeners.delete(cb); };
}
