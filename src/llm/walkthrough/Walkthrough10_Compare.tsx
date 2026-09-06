import React from 'react';
import { Phase } from "./Walkthrough";
import { commentary, embed, IWalkthroughArgs, phaseTools, setInitialCamera } from "./WalkthroughTools";
import s from './Walkthrough.module.scss';
import { Vec3 } from '@/src/utils/vector';
import { ArchDiagram, ModelOverviewTable, ScaleBars } from "@/src/llm/components/ModelComparison";

let v3PaperLink = 'https://arxiv.org/abs/2412.19437';
let r1PaperLink = 'https://arxiv.org/abs/2501.12948';
let deepSeekRepoLink = 'https://github.com/deepseek-ai/DeepSeek-V3';

export function walkthrough10_Compare(args: IWalkthroughArgs) {
    let { breakAfter } = phaseTools(args.state);
    let { state, walkthrough: wt } = args;

    if (wt.phase !== Phase.Intro_Compare) {
        return;
    }

    setInitialCamera(state, new Vec3(184.744, 0.000, -636.820), new Vec3(296.000, 16.000, 13.500));

    let c0 = commentary(wt, null, 0)`
到目前为止，你在 3D 场景里看到的是 _nano-gpt_：一个只有 8.5 万参数的玩具模型。

真实世界的前沿模型要大得多。本章把它与 ${embedLink('DeepSeek-V3', v3PaperLink)} 做一个对比 ——
DeepSeek-V3 是一个总参数 6710 亿（671B）的开源模型，而大家熟知的 DeepSeek-R1 推理模型
正是在它的基座之上训练出来的。

两者的骨架其实是同一套，但 DeepSeek 在几个关键位置做了根本性的改造。
`;

    breakAfter(c0);

    commentary(wt)`
先说_相同_的部分 —— 也就是你刚刚在 3D 场景里逐步看过的那套流程，DeepSeek 同样具备：

两者都是 _仅解码器（Decoder-only）Transformer_，本质都是"下一个词元预测器"。
数据流完全一致：词元 → 词嵌入 + 位置编码 → 堆叠若干层 → 语言模型头 → logits → softmax → 采样出下一个词元。

残差连接、多头注意力、前馈网络、归一化，这些基本构件两边都有。
`;

    breakAfter();

    commentary(wt)`
下面这张表列出主要差异，随后我们会逐条展开：${embed(CompareTable)}
`;

    breakAfter();

    commentary(wt)`
_差异一：注意力 —— MLA 对 KV 缓存做低秩压缩_

标准多头注意力（也就是 nano-gpt 用的）需要为每个头分别缓存 K 和 V。
按 DeepSeek-V3 的超参估算，每 token 每层要缓存 128 头 × 128 维 × 2（K 和 V）≈ 32768 个数值。

_多头潜在注意力（MLA）_ 的做法是：先把 K 和 V _联合压缩_ 成一个低秩潜在向量 c^KV（维度 512），
推理时只缓存这个潜在向量，外加一个携带旋转位置编码的解耦键 k^R（每头 64 维）。
于是每 token 每层只需缓存 512 + 64 = _576_ 个数值 —— 约为标准 MHA 的 1/57。

（以上为按论文超参的粗略估算。查询向量也做了低秩压缩到 1536 维，主要用于减少训练时的激活显存。）

这一点为什么重要？因为当上下文拉到 128K 时，KV 缓存会成为显存的主要开销，
MLA 正是 DeepSeek 能把长上下文推理成本压下来的关键。
`;

    breakAfter();

    commentary(wt)`
_差异二：前馈网络 —— 从稠密 MLP 到 MoE 稀疏激活_

nano-gpt 的前馈网络是一个 _稠密_ MLP：中间层宽度是隐藏维度的 4 倍，
_每一个_ token 都要经过_全部_这些参数。

DeepSeek-V3 除了最前面的 3 层之外，把其余所有前馈网络都换成了 _DeepSeekMoE_ 层：
1 个共享专家 + _256 个路由专家_（每个专家中间维度 2048），
而每个 token _只激活其中 8 个_路由专家。

这一改动造就了它最关键的特性：总参数 _671B_，但每个 token 只激活 _37B_。
也就是说，模型可以"装下"海量知识，而单次推理的计算量却只相当于一个 370 亿参数的稠密模型。

为了让 256 个专家不被少数几个"撑死"，DeepSeek-V3 首创了 _无辅助损失_ 的负载均衡策略：
给每个专家维护一个可动态调整的偏置项参与路由打分（偏置只影响路由，不影响门控值），
专家过载就调低、空闲就调高；再配一个权重极小的序列级辅助损失兜底。
得益于这套机制，它在训练和推理时都_不丢弃任何 token_。
`;

    breakAfter();

    commentary(wt)`
_差异三：归一化、激活函数与位置编码_

- 归一化：nano-gpt 用的 _LayerNorm_（减均值、除标准差，再学一组缩放 γ 和平移 β）→
  DeepSeek 换成 _RMSNorm_（只按均方根缩放，不做中心化），计算更省。
- 激活函数：_GELU_ → _SwiGLU_。
- 位置编码：nano-gpt 使用一张 _可学习的位置嵌入表_，而 DeepSeek 使用
  _RoPE 旋转位置编码_；随后再用 _YaRN_ 分两个阶段把上下文窗口从预训练的 4K
  依次扩展到 32K、再到 _128K_。

_训练与工程_方面也值得留意：14.8 万亿 token 预训练、FP8 混合精度训练、
自研的 DualPipe 流水并行、以及 _多词元预测（MTP）_ 训练目标（深度为 1，
即每个位置额外多预测一个未来词元；推理时可直接丢弃，也可用于投机解码加速）。
全部训练只花了 278.8 万 H800 GPU 小时。

至于 ${embedLink('DeepSeek-R1', r1PaperLink)}，它是在 V3 基座之上，
用 _GRPO_ 强化学习专门强化长链推理能力训练而来的。
`;

    breakAfter();

    commentary(wt)`
_一个重要的说明：3D 场景里的 DeepSeek 并不真实_

你在场景里点开 "DeepSeek-V3（规模示意）" 看到的那个大模型，只是按真实超参
（61 层、隐藏维度 7168、128 个注意力头、词表 128K）画出来的_稠密骨架_。

它_不包含_ MLA 的潜在向量，也_没有_那 256 个 MoE 路由专家 ——
而后者恰恰承载着 671B 参数中的绝大部分。换句话说，DeepSeek 真正的"体积"在这个场景里基本是缺席的，
所以它在视觉上看起来甚至比一些参数量更小的模型还要"小"。

这是渲染器的能力边界，而不是 DeepSeek 的真实架构。场景里那个模型的序列长度显示为 1024
（真实上下文是 128K），同样是出于渲染性能的折中。

    想深入了解，推荐阅读 ${embedLink('DeepSeek-V3 技术报告', v3PaperLink)}
和 ${embedLink('官方代码仓库', deepSeekRepoLink)}。
`;

    breakAfter();

    commentary(wt)`
_顺带一提：3D 场景里现在还有这几块"规模示意"_

除了 nano-gpt 与 DeepSeek-V3，场景里现在也摆上了 _GPT-3_、_Kimi K2.6_、_Qwen3-235B-A22B_ 与
_Llama 4 Maverick_ 的稠密骨架块。在右侧"模型"工具条里点选即可飞到对应模型，绕着镜头转一圈，
你就能直观感受到从 8.5 万参数一路涨到千亿 / 万亿参数的体量鸿沟。

和 DeepSeek 一样，这几块也都只是_规模示意_：渲染器没有 MoE 专家与 MLA 低秩压缩的概念，
所以 GPT-3 之后那些万亿级 MoE 模型的"真实体积"在场景里同样是缺席的。
以上数据来自 2026-09 的网络检索，仅用于直观感受。
`;

    breakAfter();

    commentary(wt)`
_把视野拉宽：看看当下的四大主流前沿模型_

前面我们比较了 nano-gpt 与 DeepSeek-V3。下面把视野拉宽，看看当下四个主流前沿模型——
它们有的开源、有的闭源，体量和处理长度都远超玩具模型：${embed(ModelOverviewTable)}

一个关键点：真实前沿模型普遍采用 _MoE 稀疏架构_（DeepSeek、Kimi），上下文窗口从 128K 一路拉到 2M；
而 GPT-5.6、Claude Opus 4.6、Gemini 3.1 Pro 作为闭源模型，参数量并未公开。
`;

    breakAfter();

    commentary(wt)`
_体量：差了 4~5 个数量级_

${embed(ScaleBars)}

注意 nano-gpt 只有 8.5 万参数，而 DeepSeek / Kimi 是百亿到万亿级别——这正是"玩具"与"前沿"之间的体量鸿沟。
上下文长度同理：从 6 个字母扩展到百万级 token。闭源三家的参数量未公开，故条形图中不显示。
`;

    breakAfter();

    commentary(wt)`
_架构：稠密 vs 稀疏 MoE_

${embed(ArchDiagram)}

nano-gpt 是 _稠密_ 模型：每个 token 都要经过全部参数。DeepSeek-V3 与 Kimi K2.6 则用 _MoE_——
总参数能装下海量知识，但每个 token 只激活极小一部分（如 Kimi：384 个专家里只选 8 个 + 1 个共享专家），
因此"大而不贵"。闭源三家的内部架构未公开，但同样普遍采用 MoE 已是业界共识。

（以上数据来自 2026-09 的网络检索，仅用于直观感受，具体数值会随厂商更新而变动。）
`;

    breakAfter();
}

function embedLink(a: React.ReactNode, href: string) {
    return embedInline(<a className={s.externalLink} href={href} target="_blank" rel="noopener noreferrer">{a}</a>);
}

function embedInline(a: React.ReactNode) {
    return { insertInline: a };
}

const CompareTable: React.FC = () => {
    let rows: [string, string, string][] = [
        ['总参数量', '8.5 万', '6710 亿 (671B)'],
        ['每 token 激活参数', '8.5 万（全部）', '370 亿 (37B)'],
        ['层数', '3 层', '61 层'],
        ['隐藏维度 C', '48', '7168'],
        ['注意力', '3 头标准 MHA（Q/K/V）', '128 头 MLA（低秩潜在压缩）'],
        ['KV 缓存（每 token 每层）', '3 头 × 16 维 × 2', '512 + 64 ≈ 576（约 MHA 的 1/57）'],
        ['前馈网络', '稠密 MLP（4×C，GELU）', 'DeepSeekMoE：1 共享 + 256 路由，激活 8 个'],
        ['激活函数', 'GELU', 'SwiGLU'],
        ['归一化', 'LayerNorm', 'RMSNorm'],
        ['位置编码', '可学习位置嵌入表', 'RoPE + YaRN 扩展'],
        ['词表大小', '3（A、B、C）', '128K'],
        ['上下文长度', '6 个字母', '128K'],
        ['训练目标', '排序（监督学习）', '下一词元预测 + MTP（深度 1）'],
        ['后训练', '—', 'SFT + GRPO 强化学习（R1）'],
        ['预训练数据', '小型合成排序任务', '14.8 万亿 token'],
    ];

    return <div className={s.tableWrap}>
        <table className={s.table}>
            <thead>
                <tr>
                    <th>维度</th>
                    <th>nano-gpt（本页 3D）</th>
                    <th>DeepSeek-V3</th>
                </tr>
            </thead>
            <tbody>
                {rows.map(([k, a, b], i) => {
                    return <tr key={i}>
                        <th>{k}</th>
                        <td>{a}</td>
                        <td>{b}</td>
                    </tr>;
                })}
            </tbody>
        </table>
    </div>;
};
