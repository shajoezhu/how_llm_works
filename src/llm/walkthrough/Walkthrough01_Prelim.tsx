import React from 'react';
import { Phase } from "./Walkthrough";
import { commentary, embed, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";
import s from './Walkthrough.module.scss';
import { Vec3 } from '@/src/utils/vector';

let minGptLink = 'https://github.com/karpathy/minGPT';
let pytorchLink = 'https://pytorch.org/';
let andrejLink = 'https://karpathy.ai/';
let zeroToHeroLink = 'https://karpathy.ai/zero-to-hero.html';

export function walkthrough01_Prelim(args: IWalkthroughArgs) {
    let { state, walkthrough: wt } = args;

    if (wt.phase !== Phase.Intro_Prelim) {
        return;
    }

    setInitialCamera(state, new Vec3(184.744, 0.000, -636.820), new Vec3(296.000, 16.000, 13.500));

    let c0 = commentary(wt, null, 0)`
在深入探究算法的复杂细节之前，让我们先退一步简要回顾。

本指南聚焦于_推理_而非训练，因此只是整个机器学习流程中的一小部分。
在我们的例子中，模型的权重已经过预训练，我们通过推理过程来生成输出。这一切都直接在您的浏览器中运行。

这里展示的模型属于 GPT（生成式预训练 Transformer）家族，可描述为"基于上下文的词元预测器"。
OpenAI 于 2018 年推出了这一家族，其著名成员包括 GPT-2、GPT-3 以及 GPT-3.5 Turbo，后者是广为人知的 ChatGPT 的基础。
它也可能与 GPT-4 有关，但具体细节仍未公开。

本指南的灵感来自 ${embedLink('minGPT', minGptLink)} GitHub 项目，这是一个用 ${embedLink('PyTorch', pytorchLink)} 实现的极简 GPT
由 ${embedLink('Andrej Karpathy', andrejLink)} 创建。
他的 YouTube 系列课程 ${embedLink("Neural Networks: Zero to Hero", zeroToHeroLink)} 以及 minGPT 项目，是创建本指南过程中不可或缺的资源。
这里展示的玩具模型基于 minGPT 项目中的一个模型。

好了，让我们开始吧！
`;

}

export function embedLink(a: React.ReactNode, href: string) {
    return embedInline(<a className={s.externalLink} href={href} target="_blank" rel="noopener noreferrer">{a}</a>);
}

export function embedInline(a: React.ReactNode) {
    return { insertInline: a };
}


// Another similar model is BERT (bidirectional encoder representations from transformers), a "context-aware text encoder" commonly
// used for tasks like document classification and search.  Newer models like Facebook's LLaMA (large language model architecture), continue to use
// a similar transformer architecture, albeit with some minor differences.
