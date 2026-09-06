import { duplicateGrid, splitGrid } from "../Annotations";
import { getBlockValueAtIdx } from "../components/DataFlow";
import { IBlkDef } from "../GptModelLayout";
import { drawText, IFontOpts, measureText } from "../render/fontRender";
import { lerp } from "@/src/utils/math";
import { Mat4f } from "@/src/utils/matrix";
import { Dim, Vec3, Vec4 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, DimStyle, IWalkthroughArgs, moveCameraTo, setInitialCamera } from "./WalkthroughTools";
import { processUpTo, startProcessBefore } from "./Walkthrough00_Intro";

export function walkthrough02_Embedding(args: IWalkthroughArgs) {
    let { walkthrough: wt, state, tools: { c_str, c_blockRef, c_dimRef, afterTime, cleanup, breakAfter }, layout } = args;
    let render = state.render;

    if (wt.phase !== Phase.Input_Detail_Embedding) {
        return;
    }

    setInitialCamera(state, new Vec3(15.654, 0.000, -80.905), new Vec3(287.000, 14.500, 3.199));
    wt.dimHighlightBlocks = [layout.idxObj, layout.tokEmbedObj, layout.posEmbedObj, layout.residual0];

    commentary(wt)`
    我们之前看到，词元是如何通过一个简单的查找表被映射为一个整数序列的。
    这些整数，也就是 ${c_blockRef('_词元索引_', state.layout.idxObj, DimStyle.TokenIdx)}，是我们在整个模型中唯一一次看到整数。
    从这一步开始，我们使用的就都是浮点数（小数）了。

让我们来看看第 4 个词元（索引 3）是如何用来生成我们的 ${c_blockRef('_输入词嵌入_', state.layout.residual0)} 的第 4 个列向量的。`;
    breakAfter();

    let t_moveCamera = afterTime(null, 1.0);
    let t0_splitEmbedAnim = afterTime(null, 0.3);

    breakAfter();

    commentary(wt)`
    我们使用词元索引（在本例中 ${c_str('B', DimStyle.Token)} = ${c_dimRef('1', DimStyle.TokenIdx)}）来选择左侧 ${c_blockRef('_词元嵌入矩阵_', state.layout.tokEmbedObj)} 的第 2 列。
    注意这里我们使用的是从 0 开始的索引，所以第一列位于索引 0。

    这会生成一个大小为 ${c_dimRef('_C_ = 48', DimStyle.C)} 的列向量，我们称之为词元嵌入。
    `;
    breakAfter();

    let t1_fadeEmbedAnim = afterTime(null, 0.3);
    let t2_highlightTokenEmbed = afterTime(null, 0.8);

    breakAfter();

    commentary(wt)`
    由于我们查看的是位于第 4 个 _位置_（t = ${c_dimRef('3', DimStyle.T)}）处的词元 ${c_str('B', DimStyle.Token)}，我们将取 ${c_blockRef('_位置嵌入矩阵_', state.layout.posEmbedObj)} 的第 4 列。

    这同样会生成一个大小为 ${c_dimRef('_C_ = 48', DimStyle.C)} 的列向量，我们称之为位置嵌入。
    `;
    breakAfter();

    let t4_highlightPosEmbed = afterTime(null, 0.8);

    breakAfter();

    commentary(wt)`
    注意，这两个位置嵌入和词元嵌入都是在训练过程中学习得到的（由它们的蓝色表示）。

    既然我们已经有了这两个列向量，我们只需将它们相加，得到另一个大小为 ${c_dimRef('_C_ = 48', DimStyle.C)} 的列向量。
`;

    breakAfter();

    let t3_moveTokenEmbed = afterTime(null, 0.8);
    let t5_movePosEmbed = afterTime(null, 0.8);
    let t6_plusSymAnim = afterTime(null, 0.8);
    let t7_addAnim = afterTime(null, 0.8);
    let t8_placeAnim = afterTime(null, 0.8);
    let t9_cleanupInstant = afterTime(null, 0.0);
    let t10_fadeAnim = afterTime(null, 0.8);

    breakAfter();

    commentary(wt)`
我们现在对输入序列中的所有词元运行相同的过程，得到一组既包含词元取值又包含其位置的向量。

`;

    breakAfter();

    let t11_fillRest = afterTime(null, 5.0);

    breakAfter();

    commentary(wt)`
    你可以将鼠标悬停在 ${c_blockRef('_输入词嵌入_', state.layout.residual0)} 矩阵的各个单元格上，查看其中的计算及其来源。

    我们看到，对输入序列中的所有词元运行该过程后，会得到一个大小为 ${c_dimRef('_T_', DimStyle.T)} x ${c_dimRef('_C_', DimStyle.C)} 的矩阵。
    ${c_dimRef('_T_', DimStyle.T)} 代表 ${c_dimRef('_时间_', DimStyle.T)}，也就是说，你可以把序列中越靠后的词元看作出现得越晚。
    ${c_dimRef('_C_', DimStyle.C)} 代表 ${c_dimRef('_通道_', DimStyle.C)}，但也被称作 "feature"（特征）、"dimension"（维度）或 "embedding size"（嵌入维度）。这个长度 ${c_dimRef('_C_', DimStyle.C)}，
    是模型的若干"超参数"之一，由设计者在模型规模与性能之间进行权衡后选定。

    这个矩阵，也就是我们将称之为 ${c_blockRef('_输入词嵌入_', state.layout.residual0)} 的矩阵，现在已准备好向下传递到模型中进行处理。
    这 ${c_dimRef('T', DimStyle.T)} 个列向量、每个长度为 ${c_dimRef('C', DimStyle.C)} 的集合，将成为贯穿本指南的常见景象。
`;

    cleanup(t9_cleanupInstant, [t3_moveTokenEmbed, t5_movePosEmbed, t6_plusSymAnim, t7_addAnim, t8_placeAnim]);
    cleanup(t10_fadeAnim, [t0_splitEmbedAnim, t1_fadeEmbedAnim, t2_highlightTokenEmbed, t4_highlightPosEmbed]);

    moveCameraTo(state, t_moveCamera, new Vec3(7.6, 0, -33.1), new Vec3(290, 15.5, 0.8));

    let residCol: IBlkDef = null!;
    let exampleIdx = 3;
    if ((t0_splitEmbedAnim.t > 0.0 || t10_fadeAnim.t > 0.0) && t11_fillRest.t === 0) {
        splitGrid(layout, layout.idxObj, Dim.X, exampleIdx + 0.5, t0_splitEmbedAnim.t * 4.0);

        layout.residual0.access!.disable = true;
        layout.residual0.opacity = lerp(1.0, 0.1, t1_fadeEmbedAnim.t);

        residCol = splitGrid(layout, layout.residual0, Dim.X, exampleIdx + 0.5, t0_splitEmbedAnim.t * 4.0)!;
        residCol.highlight = 0.3;

        residCol.opacity = lerp(1.0, 0.0, t1_fadeEmbedAnim.t);

    }

    let tokValue = getBlockValueAtIdx(layout.idxObj, new Vec3(exampleIdx, 0, 0)) ?? 1;


    let tokColDupe: IBlkDef | null = null;
    let posColDupe: IBlkDef | null = null;

    if (t2_highlightTokenEmbed.t > 0.0) {
        let tokEmbedCol = splitGrid(layout, layout.tokEmbedObj, Dim.X, tokValue + 0.5, t2_highlightTokenEmbed.t * 4.0)!;

        tokColDupe = duplicateGrid(layout, tokEmbedCol);
        tokColDupe.t = 'i';
        tokEmbedCol.highlight = 0.3;

        let startPos = new Vec3(tokEmbedCol.x, tokEmbedCol.y, tokEmbedCol.z);
        let targetPos = new Vec3(residCol.x, residCol.y, residCol.z).add(new Vec3(-2.0, 0, 3.0));

        let pos = startPos.lerp(targetPos, t3_moveTokenEmbed.t);

        tokColDupe.x = pos.x;
        tokColDupe.y = pos.y;
        tokColDupe.z = pos.z;
    }


    if (t4_highlightPosEmbed.t > 0.0) {
        let posEmbedCol = splitGrid(layout, layout.posEmbedObj, Dim.X, exampleIdx + 0.5, t4_highlightPosEmbed.t * 4.0)!;

        posColDupe = duplicateGrid(layout, posEmbedCol);
        posColDupe.t = 'i';
        posEmbedCol.highlight = 0.3;

        let startPos = new Vec3(posEmbedCol.x, posEmbedCol.y, posEmbedCol.z);
        let targetPos = new Vec3(residCol.x, residCol.y, residCol.z).add(new Vec3(2.0, 0, 3.0));

        let pos = startPos.lerp(targetPos, t5_movePosEmbed.t);

        posColDupe.x = pos.x;
        posColDupe.y = pos.y;
        posColDupe.z = pos.z;
    }

    if (t6_plusSymAnim.t > 0.0 && tokColDupe && posColDupe && t7_addAnim.t < 1.0) {
        for (let c = 0; c < layout.shape.C; c++) {
            let plusCenter = new Vec3(
                (tokColDupe.x + tokColDupe.dx + posColDupe.x) / 2,
                tokColDupe.y + layout.cell * (c + 0.5),
                tokColDupe.z + tokColDupe.dz / 2);

            let isActive = t6_plusSymAnim.t > (c + 1) / layout.shape.C;
            let opacity = lerp(0.0, 1.0, isActive ? 1 : 0);

            let fontOpts: IFontOpts = { color: new Vec4(0, 0, 0, 1).mul(opacity), size: 1.5, mtx: Mat4f.fromTranslation(plusCenter) };
            let w = measureText(render.modelFontBuf, '+', fontOpts);

            drawText(render.modelFontBuf, '+', -w/2, -fontOpts.size/2, fontOpts);
        }
    }

    let origResidPos = residCol ? new Vec3(residCol.x, residCol.y, residCol.z) : new Vec3();
    let offsetResidPos = origResidPos.add(new Vec3(0.0, 0, 3.0));

    if (t7_addAnim.t > 0.0 && tokColDupe && posColDupe) {
        let targetPos = offsetResidPos;
        let tokStartPos = new Vec3(tokColDupe.x, tokColDupe.y, tokColDupe.z);
        let posStartPos = new Vec3(posColDupe.x, posColDupe.y, posColDupe.z);

        let tokPos = tokStartPos.lerp(targetPos, t7_addAnim.t);
        let posPos = posStartPos.lerp(targetPos, t7_addAnim.t);

        tokColDupe.x = tokPos.x;
        tokColDupe.y = tokPos.y;
        tokColDupe.z = tokPos.z;
        posColDupe.x = posPos.x;
        posColDupe.y = posPos.y;
        posColDupe.z = posPos.z;

        if (t7_addAnim.t > 0.95) {
            tokColDupe.opacity = 0.0;
            posColDupe.opacity = 0.0;
            residCol.opacity = 1.0;
            residCol.highlight = 0.0;
            residCol.access!.disable = false;
            residCol.x = targetPos.x;
            residCol.y = targetPos.y;
            residCol.z = targetPos.z;
        }
    }

    if (t8_placeAnim.t > 0.0) {
        let startPos = offsetResidPos;
        let targetPos = origResidPos;
        let pos = startPos.lerp(targetPos, t8_placeAnim.t);
        residCol.x = pos.x;
        residCol.y = pos.y;
        residCol.z = pos.z;
    }

    if (t9_cleanupInstant.t > 0.0 && residCol) {
        residCol.opacity = 1.0;
        residCol.highlight = 0.0;
        residCol.access!.disable = false;
    }

    if (t11_fillRest.t > 0.0) {
        layout.residual0.access!.disable = true;

        let prevInfo = startProcessBefore(state, layout.residual0);
        processUpTo(state, t11_fillRest, layout.residual0, prevInfo);
    }
    // new Vec3(-6.9, 0, -36.5), new Vec3(281.5, 5.5, 0.8)
}
