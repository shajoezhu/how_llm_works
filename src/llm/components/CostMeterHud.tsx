'use client';

import React, { useEffect, useReducer } from 'react';
import { ASSUMED_PRICE_PER_M_TOKENS, CONTEXT_WINDOW, costMeter, MODEL_PARAMS, subscribeCost } from '../CostMeter';

// 常驻在页面左下角的"成本计数器"：实时显示本次演示累计花了多少 token / 多少次前向 / 估算花费。
// 读者最关心"这活儿要花多少钱"，这个面板就是直接回答这个问题。

export const CostMeterHud: React.FC = () => {
    let [, force] = useReducer((x: number) => x + 1, 0);

    useEffect(() => {
        return subscribeCost(force);
    }, []);

    let tokens = costMeter.tokensProcessed;
    let passes = costMeter.forwardPasses;
    let usd = costMeter.usdEstimate;
    let flops = costMeter.flopsEstimate;

    let fmtInt = (n: number) => n.toLocaleString('en-US');
    let fmtUsd = (n: number) => '$' + n.toFixed(7);
    let fmtFlops = (n: number) => {
        if (n >= 1e9) return (n / 1e9).toFixed(2) + ' G';
        if (n >= 1e6) return (n / 1e6).toFixed(2) + ' M';
        if (n >= 1e3) return (n / 1e3).toFixed(2) + ' K';
        return n.toString();
    };

    return (
        <div style={{
            position: 'fixed',
            left: 12,
            bottom: 34,
            zIndex: 1100,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(8, 12, 24, 0.82)',
            border: '1px solid rgba(124, 196, 255, 0.35)',
            color: '#e6ebf5',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            fontSize: 12,
            lineHeight: 1.5,
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            minWidth: 188,
            pointerEvents: 'none',
        }}>
            <div style={{ color: '#7cc4ff', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>
                成本计数器
            </div>
            <Row label="已处理 token" value={fmtInt(tokens)} />
            <Row label="前向计算次数" value={fmtInt(passes)} />
            <Row label="估算运算量" value={fmtFlops(flops) + ' FLOPs'} />
            <Row label="估算花费" value={fmtUsd(usd)} highlight />
            <div style={{ marginTop: 6, fontSize: 10, color: '#8b93a7', lineHeight: 1.4 }}>
                模型参数量 {fmtInt(MODEL_PARAMS)}，上下文窗口 {CONTEXT_WINDOW}。<br />
                单价假设 ${ASSUMED_PRICE_PER_M_TOKENS}/百万 token，仅用于直观感受，非真实账单。
            </div>
        </div>
    );
};

const Row: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ color: '#9aa3b8' }}>{label}</span>
        <span style={{ color: highlight ? '#ffd479' : '#e6ebf5', fontWeight: highlight ? 700 : 400 }}>{value}</span>
    </div>
);
