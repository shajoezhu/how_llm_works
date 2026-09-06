import React from "react";
import { Dim, Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, DimStyle, dimStyleColor, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";
import { dimProps, findSubBlocks, splitGrid } from "../Annotations";
import { lerp } from "@/src/utils/math";
import { IBlkDef, getBlkDimensions } from "../GptModelLayout";
import { processUpTo, startProcessBefore } from "./Walkthrough00_Intro";
import { drawDataFlow } from "../components/DataFlow";
import { drawDependences } from "../Interaction";
import { makeArray, makeArrayRange } from "@/src/utils/data";

export function walkthrough07_Mlp(args: IWalkthroughArgs) {
    let { walkthrough: wt, state, layout, tools: { afterTime, c_blockRef, c_dimRef, breakAfter, cleanup } } = args;

    if (wt.phase !== Phase.Input_Detail_Mlp) {
        return;
    }

    let block = layout.blocks[0];

    setInitialCamera(state, new Vec3(-154.755, 0.000, -460.042), new Vec3(289.100, -8.900, 2.298));
    wt.dimHighlightBlocks = [block.ln2.lnResid, block.mlpAct, block.mlpFc, block.mlpFcBias, block.mlpFcWeight, block.mlpProjBias, block.mlpProjWeight, block.mlpResult, block.mlpResidual];

    commentary(wt)`

Transformer块的后半部分在自注意力之后，是MLP(多层感知机)。听起来有点绕口，但它在这里只是一个简单的两层神经网络。

和自注意力一样，我们先对向量执行一次${c_blockRef('层归一化', block.ln2.lnResid)}，再让向量进入MLP。

在MLP中，我们将每个长度为${c_dimRef('C = 48', DimStyle.C)}的列向量（独立地）依次经过：

1. 一个${c_blockRef('线性变换', block.mlpFcWeight)}，并加上一个${c_blockRef('偏置', block.mlpFcBias)}，将向量扩展到长度为${c_dimRef('4 * C', DimStyle.C4)}。

2. 一个GELU激活函数（逐元素）

3. 一个${c_blockRef('线性变换', block.mlpProjWeight)}，并加上一个${c_blockRef('偏置', block.mlpProjBias)}，将向量投影回长度为${c_dimRef('C', DimStyle.C)}

我们来跟踪其中一个向量：
`;
    breakAfter();

    let t0_fadeOut = afterTime(null, 1.0);

    breakAfter();

commentary(wt)`
我们首先完成带偏置的矩阵-向量乘法，将向量扩展到长度为${c_dimRef('4 * C', DimStyle.C4)}。（注意这里的输出矩阵被转置了。
这纯粹是为了可视化目的。）
`;
    breakAfter();

    let t1_process = afterTime(null, 3.0);

    breakAfter();

commentary(wt)`
接下来，我们对向量的每个元素应用GELU激活函数。这是任何神经网络的关键部分，我们借此为模型引入一些非线性。所使用的具体函数GELU
看起来很像ReLU函数（计算方式为${<code>max(0, x)</code>}），但它是一条平滑曲线，而非尖锐的拐角。

${<ReluGraph />}

`;
    breakAfter();

    let t2_process = afterTime(null, 3.0);

    breakAfter();

commentary(wt)`
然后，我们再次通过带偏置的矩阵-向量乘法，将向量投影回长度为${c_dimRef('C', DimStyle.C)}。
`;
    breakAfter();

    let t3_process = afterTime(null, 3.0);

    breakAfter();

commentary(wt)`
与自注意力 + 投影部分类似，我们将MLP的结果逐元素地加到它的输入上。
`;
    breakAfter();

    let t4_process = afterTime(null, 3.0);

    breakAfter();
commentary(wt)`
现在我们可以对输入中的所有列重复这一过程。`;

    breakAfter();

    let t5_cleanup = afterTime(null, 1.0, 0.5);
    cleanup(t5_cleanup, [t0_fadeOut]);
    let t6_processAll = afterTime(null, 6.0);

    breakAfter();

commentary(wt)`
MLP就此完成。我们现在得到了Transformer块的输出，它已准备好传递给下一个块。
`;

    let targetIdx = 3;
    let inputBlk = block.ln2.lnResid;
    let mlp1Blk = block.mlpFc;
    let mlp2Blk = block.mlpAct;
    let mlpRes = block.mlpResult;
    let mlpResid = block.mlpResidual;

    function dimExceptVector(blk: IBlkDef, axis: Dim, disable: boolean) {
        if (t0_fadeOut.t === 0 || t6_processAll.t > 0) {
            return;
        }

        if (disable) {
            blk.access!.disable = true;
        }

        let col = splitGrid(layout, blk, axis, targetIdx + 0.5, lerp(0.0, 1.0, t0_fadeOut.t))!;

        for (let sub of blk.subs!) {
            sub.opacity = lerp(1.0, 0.2, t0_fadeOut.t);
        }

        col.opacity = 1.0;

        return col!;
    }

    dimExceptVector(inputBlk, Dim.X, false);
    let mlp1Col = dimExceptVector(mlp1Blk, Dim.Y, true);
    let mlp2Col = dimExceptVector(mlp2Blk, Dim.Y, true);
    let mlpResCol = dimExceptVector(mlpRes, Dim.X, true);
    let mplResIdCol = dimExceptVector(mlpResid, Dim.X, true);

    function processVector(blk: IBlkDef, col: IBlkDef | undefined, t: number, pinIdx: Vec3) {
        if (t === 0) {
            return;
        }

        let dim0 = blk.transpose ? Dim.Y : Dim.X;
        let dim1 = blk.transpose ? Dim.X : Dim.Y;
        let { cx: numCells } = dimProps(blk, dim1);

        let xPos = Math.floor(lerp(0, numCells, t));

        let destIdx = new Vec3().setAt(dim0, targetIdx).setAt(dim1, xPos).round_();

        if (col) {
            let row = splitGrid(layout, col, dim1, xPos, 0.0);
            for (let a of findSubBlocks(col, dim1, 0, xPos)) {
                a.access!.disable = false;
            }
        }

        if (t < 1.0) {
            drawDataFlow(state, blk, destIdx, pinIdx);
            drawDependences(state, blk, destIdx);
        } else if (col) {
            col!.access!.disable = false;
        }
    }

    processVector(mlp1Blk, mlp1Col, t1_process.t, new Vec3(40));
    processVector(mlp2Blk, mlp2Col, t2_process.t, new Vec3(mlp1Blk.cx / 2, -15));
    processVector(mlpRes, mlpResCol, t3_process.t, new Vec3(mlpRes.cx / 2, -15));
    processVector(mlpResid, mplResIdCol, t4_process.t, new Vec3(mlpRes.cx / 2, -15));

    if (t5_cleanup.t > 0.4) {
        mlp1Blk.access!.disable = true;
        mlp2Blk.access!.disable = true;
        mlpRes.access!.disable = true;
        mlpResid.access!.disable = true;
    }

    if (t6_processAll.t > 0) {
        let prevInfo = startProcessBefore(state, inputBlk);
        processUpTo(state, t6_processAll, mlpResid, prevInfo);
    }
}


const ReluGraph: React.FC = () => {

    let fnRelu = (x: number) => Math.max(0, x);
    let fnGelu = (x: number) => x * 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3))));

    function createMapping(range0: number, range1: number, domain0: number, domain1: number) {
        let m = (range1 - range0) / (domain1 - domain0);
        let b = range0 - m * domain0;
        return (x: number) => m * x + b;
    }

    let w = 200;
    let h = 160;

    let halfW = 3.2;
    let halfH = halfW * h / w;
    let hOffset = 1.1;

    let xScale = createMapping(0, w, -halfW, halfW);
    let yScale = createMapping(h, 0, -halfH + hOffset, halfH + hOffset);

    let xPts = makeArrayRange(100, -halfW, halfW);

    function makePath(fn: (x: number) => number) {
        let path = "";
        for (let x of xPts) {
            let y = fn(x);
            path += (path ? 'L' : 'M') + `${xScale(x)},${yScale(y)} `;
        }
        return path;
    }

    let vertTickVals = [-1, 1, 2, 3];

    let vertTicks = vertTickVals.map(a => {
        return { x: xScale(0), y: yScale(a), label: a };
    });

    let horizTickVals = [-3, -2, -1, 1, 2, 3];
    let horizTicks = horizTickVals.map(a => {
        return { x: xScale(a), y: yScale(0), label: a };
    });

    let tickColor = "gray";

    return <div className="flex justify-center my-2">
        <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="bg-slate-200 rounded">
            <line x1={xScale(-halfW)} x2={xScale(halfW)} y1={yScale(0)} y2={yScale(0)} stroke={"gray"} strokeWidth={1} />
            <line x1={xScale(0)} x2={xScale(0)} y1={yScale(-halfH + hOffset)} y2={yScale(halfH + hOffset)} stroke={"gray"} strokeWidth={1} />
            {/* <path d={makePath(fnRelu)} stroke={"blue"} fill="none" strokeWidth={1} /> */}
            <path d={makePath(fnGelu)} stroke={dimStyleColor(DimStyle.Intermediates).toHexColor()} fill="none" strokeWidth={3} />
            {vertTicks.map((a, i) => <g key={i} transform={`translate(${a.x}, ${a.y})`}>
                <line x1={-5} x2={5} y1={0} y2={0} stroke={tickColor} strokeWidth={1} />
                <text x={10} y={5} fontSize={10} fill={tickColor}>{a.label}</text>
            </g>)}
            {horizTicks.map((a, i) => <g key={i} transform={`translate(${a.x}, ${a.y})`}>
                <line x1={0} x2={0} y1={-5} y2={5} stroke={tickColor} strokeWidth={1} />
                <text x={0} y={18} fontSize={10} textAnchor="middle" fill={tickColor}>{a.label}</text>
            </g>)}
        </svg>
    </div>;
};
