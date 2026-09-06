import React from 'react';

// 主流大模型「体量 + 架构」对比的可视化组件。
// 数据来源：2026-09 网络检索，仅供直观感受，具体数值会随厂商更新而变动。
// 注意：GPT-5.6 / Claude Opus 4.6 / Gemini 3.1 Pro 为闭源模型，参数量未公开。

interface IModelSpec {
    name: string;
    maker: string;
    released: string;
    arch: string;            // 稠密 / MoE / 未公开
    totalParams: string;     // 显示用
    totalParamsNum: number | null;
    activeParams: string;
    activeParamsNum: number | null;
    layers: string;
    context: string;
    contextNum: number | null;
    open: string;            // 开源 / 闭源
    note: string;
}

const MODELS: IModelSpec[] = [
    {
        name: 'nano-gpt（本页 3D）', maker: '演示用玩具模型', released: '—',
        arch: '稠密', totalParams: '8.5 万', totalParamsNum: 85_000,
        activeParams: '8.5 万（全部）', activeParamsNum: 85_000,
        layers: '3', context: '6（演示序列）', contextNum: 6,
        open: '开源', note: '仅做字母排序，用来讲清机制',
    },
    {
        name: 'DeepSeek-V3', maker: 'DeepSeek', released: '2024-12',
        arch: 'MoE', totalParams: '6710 亿 (671B)', totalParamsNum: 671e9,
        activeParams: '370 亿 (37B)', activeParamsNum: 37e9,
        layers: '61', context: '128K', contextNum: 128_000,
        open: '开源', note: 'MLA 注意力 + DeepSeekMoE（256 专家激活 8）',
    },
    {
        name: 'Kimi K2.6', maker: '月之暗面 Moonshot', released: '2026-04',
        arch: 'MoE', totalParams: '1T', totalParamsNum: 1e12,
        activeParams: '32B', activeParamsNum: 32e9,
        layers: '61', context: '256K', contextNum: 256_000,
        open: '开源', note: 'MLA + MoE（384 专家激活 8 + 1 共享），原生多模态',
    },
    {
        name: 'GPT-5.6', maker: 'OpenAI', released: '2026-07',
        arch: '未公开', totalParams: '未公开', totalParamsNum: null,
        activeParams: '未公开', activeParamsNum: null,
        layers: '未公开', context: '未公开', contextNum: null,
        open: '闭源', note: 'Sol / Terra / Luna 三档，前沿通用',
    },
    {
        name: 'Claude Opus 4.6', maker: 'Anthropic', released: '2026-02',
        arch: '未公开', totalParams: '未公开', totalParamsNum: null,
        activeParams: '未公开', activeParamsNum: null,
        layers: '未公开', context: '1M', contextNum: 1_000_000,
        open: '闭源', note: '长上下文 / 智能体 / 编程',
    },
    {
        name: 'Gemini 3.1 Pro', maker: 'Google', released: '2026-02',
        arch: '未公开（原生多模态）', totalParams: '未公开', totalParamsNum: null,
        activeParams: '未公开', activeParamsNum: null,
        layers: '未公开', context: '2M', contextNum: 2_000_000,
        open: '闭源', note: '原生多模态，上下文最长',
    },
];

const box: React.CSSProperties = {
    background: 'rgba(10, 16, 30, 0.6)',
    border: '1px solid rgba(124, 196, 255, 0.25)',
    borderRadius: 8,
    padding: '12px 14px',
    margin: '10px 0',
    color: '#e6ebf5',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: 12,
    lineHeight: 1.5,
};

const caption: React.CSSProperties = {
    color: '#8b93a7', fontSize: 11, marginTop: 6,
};

// 对数刻度下的条形宽度（百分比）
function logWidth(v: number, max: number): number {
    if (!v || v <= 0) return 0;
    const w = 6 + (Math.log10(v) / Math.log10(max)) * 92;
    return Math.max(6, Math.min(100, w));
}

const MAX_PARAM = 1e12;   // Kimi 1T
const MAX_CTX = 2_000_000; // Gemini 2M

export const ModelOverviewTable: React.FC = () => {
    let cols: (keyof IModelSpec)[] = ['maker', 'arch', 'totalParams', 'activeParams', 'layers', 'context', 'open'];
    let colLabels: Record<string, string> = {
        maker: '厂商', arch: '架构', totalParams: '总参数', activeParams: '激活参数',
        layers: '层数', context: '上下文', open: '开源',
    };
    return (
        <div style={box}>
            <div style={{ color: '#7cc4ff', fontWeight: 700, marginBottom: 6 }}>主流模型总览</div>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 11 }}>
                <thead>
                    <tr style={{ color: '#9aa3b8', textAlign: 'left' }}>
                        <th style={th}>模型</th>
                        {cols.map(c => <th key={c} style={th}>{colLabels[c]}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {MODELS.map(m => (
                        <tr key={m.name} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <td style={{ ...td, color: '#cfe3ff', fontWeight: 600 }}>{m.name}</td>
                            {cols.map(c => <td key={c} style={td}>{String(m[c])}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={caption}>参数量单位：万 / 亿 / T（1T = 1 万亿）；闭源模型参数量未公开。</div>
        </div>
    );
};

const th: React.CSSProperties = { padding: '4px 6px', fontWeight: 600, whiteSpace: 'nowrap' };
const td: React.CSSProperties = { padding: '4px 6px', whiteSpace: 'nowrap' };

export const ScaleBars: React.FC = () => {
    return (
        <div style={box}>
            <div style={{ color: '#7cc4ff', fontWeight: 700, marginBottom: 8 }}>体量对比（条形为对数刻度）</div>

            <div style={{ marginBottom: 10 }}>
                <div style={{ marginBottom: 4, color: '#9aa3b8' }}>上下文长度（token）</div>
                {MODELS.map(m => (
                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ width: 120, color: '#cfe3ff' }}>{m.name}</span>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 14 }}>
                            {m.contextNum
                                ? <div style={{ width: `${logWidth(m.contextNum, MAX_CTX)}%`, height: '100%', background: 'linear-gradient(90deg,#2b6cb0,#63b3ed)', borderRadius: 3 }} />
                                : <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 4px, transparent 4px, transparent 8px)' }} />}
                        </div>
                        <span style={{ width: 70, textAlign: 'right', color: m.contextNum ? '#e6ebf5' : '#8b93a7' }}>{m.context}</span>
                    </div>
                ))}
            </div>

            <div>
                <div style={{ marginBottom: 4, color: '#9aa3b8' }}>参数量（总 / 激活；闭源未公开者不显示）</div>
                {MODELS.map(m => (
                    <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span style={{ width: 120, color: '#cfe3ff' }}>{m.name}</span>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 3, height: 14 }}>
                            {m.totalParamsNum
                                ? <div style={{ width: `${logWidth(m.totalParamsNum, MAX_PARAM)}%`, height: '100%', background: 'linear-gradient(90deg,#805ad5,#b794f4)', borderRadius: 3 }} />
                                : <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05) 4px, transparent 4px, transparent 8px)' }} />}
                        </div>
                        <span style={{ width: 130, textAlign: 'right', color: m.totalParamsNum ? '#e6ebf5' : '#8b93a7', fontSize: 11 }}>
                            {m.totalParamsNum ? `${m.totalParams} / ${m.activeParams}` : '未公开'}
                        </span>
                    </div>
                ))}
            </div>
            <div style={caption}>提示：nano-gpt 的 8.5 万 与 DeepSeek/Kimi 的百亿~万亿 相差 4~5 个数量级，这正是"玩具模型"与"前沿模型"的体量鸿沟。</div>
        </div>
    );
};

export const ArchDiagram: React.FC = () => {
    // 用一个简化的专家网格示意 MoE：384 个专家里每 token 只激活 8 个
    const expertCount = 48; // 仅作示意，不代表真实 384 个
    const activeSet = new Set([3, 7, 12, 19, 24, 31, 38, 44]);

    return (
        <div style={box}>
            <div style={{ color: '#7cc4ff', fontWeight: 700, marginBottom: 8 }}>架构示意：稠密 vs 稀疏 MoE</div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {/* 稠密 */}
                <div style={{ flex: 1, minWidth: 220, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 8 }}>
                    <div style={{ color: '#9ae6b4', fontWeight: 600, marginBottom: 6 }}>稠密（Dense）—— nano-gpt</div>
                    <div style={{ background: 'linear-gradient(135deg,#2f855a,#38a169)', borderRadius: 4, padding: '14px 8px', textAlign: 'center', color: '#fff', fontSize: 11 }}>
                        前馈网络（全部参数）<br />每个 token 经过全部参数
                    </div>
                    <div style={caption}>参数量 = 实际计算量。模型越大，推理越贵。</div>
                </div>

                {/* MoE */}
                <div style={{ flex: 2, minWidth: 260, border: '1px solid rgba(255,255,255,0.12)', borderRadius: 6, padding: 8 }}>
                    <div style={{ color: '#d6bcfa', fontWeight: 600, marginBottom: 6 }}>稀疏 MoE —— DeepSeek / Kimi</div>
                    <div style={{ background: 'rgba(128,90,213,0.15)', borderRadius: 4, padding: 8 }}>
                        <div style={{ fontSize: 10, color: '#cbb3f0', marginBottom: 4 }}>路由器（Router）为每个 token 挑选专家</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
                            {Array.from({ length: expertCount }).map((_, i) => {
                                let active = activeSet.has(i);
                                let shared = i === 0;
                                return (
                                    <div key={i} title={shared ? '共享专家' : active ? '本次激活' : '未激活'}
                                        style={{
                                            aspectRatio: '1 / 1', borderRadius: 2,
                                            background: shared ? '#f6ad55'
                                                : active ? 'linear-gradient(135deg,#9f7aea,#d6bcfa)'
                                                : 'rgba(255,255,255,0.07)',
                                        }} />
                                );
                            })}
                        </div>
                        <div style={{ fontSize: 10, color: '#cbb3f0', marginTop: 4 }}>
                            示意：每 token 仅激活 <b style={{ color: '#fff' }}>8 / 384</b> 个专家（橙色为共享专家）
                        </div>
                    </div>
                    <div style={caption}>总参数可以极大（装下知识），但单次推理只算激活的那一小部分 —— 这就是 MoE 又快又大的关键。</div>
                </div>
            </div>
        </div>
    );
};
