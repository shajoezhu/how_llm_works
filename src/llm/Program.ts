import { genModelViewMatrices, ICamera, ICameraPos, updateCamera } from "./Camera";
import { drawAllArrows } from "./components/Arrow";
import { drawBlockLabels } from "./components/SectionLabels";
import { drawModelCard } from "./components/ModelCard";
import { IGptModelLink, IGpuGptModel, IModelShape } from "./GptModel";
import { genGptModelLayout, IBlkDef, IGptModelLayout } from "./GptModelLayout";
import { drawText, IFontAtlasData, IFontOpts, measureText } from "./render/fontRender";
import { initRender, IRenderState, IRenderView, renderModel, resetRenderBuffers } from "./render/modelRender";
import { beginQueryAndGetPrevMs, endQuery } from "./render/queryManager";
import { SavedState } from "./SavedState";
import { isNotNil } from "@/src/utils/data";
import { Vec3, Vec4 } from "@/src/utils/vector";
import { initWalkthrough, runWalkthrough } from "./walkthrough/Walkthrough";
import { IColorMix } from "./Annotations";
import { Mat4f } from "@/src/utils/matrix";
import { runMouseHitTesting } from "./Interaction";
import { RenderPhase } from "./render/sharedRender";
import { drawBlockInfo } from "./components/BlockInfo";
import { NativeFunctions } from "./NativeBindings";
import { IWasmGptModel, stepWasmModel, syncWasmDataWithJsAndGpu } from "./GptModelWasm";
import { IMovementInfo, manageMovement } from "./components/MovementControls";
import { IBlockRender, initBlockRender } from "./render/blockRender";
import { ILayout } from "../utils/layout";
import { DimStyle } from "./walkthrough/WalkthroughTools";
import { Subscriptions } from "../utils/hooks";

export interface IProgramState {
    native: NativeFunctions | null;
    wasmGptModel: IWasmGptModel | null;
    stepModel: boolean;
    mouse: IMouseState;
    render: IRenderState;
    inWalkthrough: boolean;
    walkthrough: ReturnType<typeof initWalkthrough>;
    camera: ICamera;
    htmlSubs: Subscriptions;
    layout: IGptModelLayout;
    mainExample: IModelExample;
    examples: IModelExample[];
    currExampleId: number;
    shape: IModelShape;
    gptGpuModel: IGpuGptModel | null;
    jsGptModel: IGptModelLink | null;
    movement: IMovementInfo;
    display: IDisplayState;
    pageLayout: ILayout;
    markDirty: () => void;
}

export interface IModelExample {
    name: string;
    shape: IModelShape;
    enabled: boolean;
    layout?: IGptModelLayout;
    blockRender: IBlockRender;
    offset: Vec3;
    modelCardOffset: Vec3;
    camera?: ICameraPos;
}

export interface IMouseState {
    mousePos: Vec3;
}

export interface IDisplayState {
    tokenColors: IColorMix | null;
    tokenIdxColors: IColorMix | null;
    tokenOutputColors: IColorMix | null;
    tokenIdxModelOpacity?: number[];
    topOutputOpacity?: number;
    lines: string[];
    hoverTarget: IHoverTarget | null;
    blkIdxHover: number[] | null;
    dimHover: DimStyle | null;
}

export interface IHoverTarget {
    subCube: IBlkDef;
    mainCube: IBlkDef;
    mainIdx: Vec3;
}

export function initProgramState(canvasEl: HTMLCanvasElement, fontAtlasData: IFontAtlasData): IProgramState {

    let render = initRender(canvasEl, fontAtlasData);
    let walkthrough = initWalkthrough();

    let prevState = SavedState.state;
    let camera: ICamera = {
        angle: prevState?.camera.angle ?? new Vec3(296, 16, 13.5),
        center: prevState?.camera.center ?? new Vec3(-8.4, 0, -481.5),
        transition: {},
        modelMtx: new Mat4f(),
        viewMtx: new Mat4f(),
        lookAtMtx: new Mat4f(),
        camPos: new Vec3(),
        camPosModel: new Vec3(),
    }

    let shape: IModelShape = {
        B: 1,
        T: 11,
        C: 48,
        nHeads: 3,
        A: 48 / 3,
        nBlocks: 3,
        vocabSize: 3,
    };

    let gpt2ShapeSmall: IModelShape = {
        B: 1,
        T: 1024,
        C: 768,
        nHeads: 12,
        A: 768 / 12,
        nBlocks: 12,
        vocabSize: 50257,
    };

    let gpt2ShapeLarge: IModelShape = {
        B: 1,
        T: 1024,
        C: 1600,
        nHeads: 25,
        A: 1600 / 25,
        nBlocks: 48,
        vocabSize: 50257,
    };

    let gpt3Shape: IModelShape = {
        B: 1,
        T: 1024,
        C: 12288,
        nHeads: 96,
        A: 12288 / 96,
        nBlocks: 96,
        vocabSize: 50257,
    };

    // DeepSeek-V3 真实超参（见 arXiv:2412.19437）：61 层、隐藏维度 7168、128 个注意力头、
    // 词表 128K。注意：这只是"稠密骨架"的规模示意 —— 渲染器没有 MLA 低秩压缩与
    // MoE 专家的概念，因此它无法表达 DeepSeek 绝大部分参数（256 个路由专家）。
    // T 取 1024 是渲染折中（真实上下文为 128K），与 GPT-2/GPT-3 条目保持一致。
    let deepSeekShape: IModelShape = {
        B: 1,
        T: 1024,
        C: 7168,
        nHeads: 128,
        A: 7168 / 128,
        nBlocks: 61,
        vocabSize: 129280,
    };

    // Kimi K2.6（规模示意）：61 层、隐藏维度 7168、64 个注意力头、词表 163840、
    // MoE（384 路由专家 / 8 激活 + 1 共享）。渲染器没有 MoE/MLA 概念，仅作稠密骨架的规模示意。
    // T 取 1024 为渲染折中（真实上下文 256K）。
    let kimiShape: IModelShape = {
        B: 1,
        T: 1024,
        C: 7168,
        nHeads: 64,
        A: 7168 / 64,
        nBlocks: 61,
        vocabSize: 163840,
    };

    // Qwen3-235B-A22B（规模示意）：94 层、隐藏维度 4096、32 个注意力头、词表 151936、
    // MoE（128 专家 / 8 激活）。同上，仅作稠密骨架的规模示意。T 取 1024 为渲染折中。
    let qwenShape: IModelShape = {
        B: 1,
        T: 1024,
        C: 4096,
        nHeads: 32,
        A: 4096 / 32,
        nBlocks: 94,
        vocabSize: 151936,
    };

    // Llama 4 Maverick（规模示意）：48 层、隐藏维度 5120、40 个注意力头、词表 202048、
    // MoE（128 专家 / 1 激活）。同上，仅作稠密骨架的规模示意。T 取 1024 为渲染折中。
    let llamaShape: IModelShape = {
        B: 1,
        T: 1024,
        C: 5120,
        nHeads: 40,
        A: 5120 / 40,
        nBlocks: 48,
        vocabSize: 202048,
    };

    function makeCamera(center: Vec3, angle: Vec3): ICameraPos {
        return { center, angle };
    }

    // 根据布局的实际包围盒，自动推算能框住整个模型块的相机位姿。
    // 3D 块的立方坐标在局部空间（未含 offset），渲染时再由 example.offset 平移，
    // 因此相机中心点 = 局部包围盒中心 + offset。
    function fitCameraFor(shape: IModelShape, offset: Vec3): ICameraPos {
        let layout = genGptModelLayout(shape, null, new Vec3());
        let mn = new Vec3(1e30, 1e30, 1e30);
        let mx = new Vec3(-1e30, -1e30, -1e30);
        for (let c of layout.cubes) {
            mn = new Vec3(Math.min(mn.x, c.x), Math.min(mn.y, c.y), Math.min(mn.z, c.z));
            mx = new Vec3(Math.max(mx.x, c.x + c.dx), Math.max(mx.y, c.y + c.dy), Math.max(mx.z, c.z + c.dz));
        }
        let center = mn.add(mx).mul(0.5).add(offset);
        let size = mx.sub(mn);
        let diag = Math.sqrt(size.x * size.x + size.y * size.y + size.z * size.z);
        // dist = 200 * angle.z，取约 0.75 倍对角距离，可完整框住整块
        let angleZ = (diag * 0.75) / 200;
        return { center, angle: new Vec3(238.959, 10.501, angleZ) };
    }

    let delta = new Vec3(10000, 0, 0);

    return {
        native: null,
        wasmGptModel: null,
        render: render!,
        inWalkthrough: true,
        walkthrough,
        camera,
        shape: shape,
        layout: genGptModelLayout(shape),
        currExampleId: -1,
        mainExample: {
            name: 'nano-gpt',
            enabled: true,
            shape: shape,
            offset: new Vec3(),
            modelCardOffset: new Vec3(),
            blockRender: null!,
            camera: makeCamera(new Vec3(42.771, 0.000, -569.287), new Vec3(284.959, 26.501, 12.867)),
        },
        examples: [{
            // 已隐藏（enabled: false）：界面与场景都不再显示，配置代码保留以便日后恢复
            name: 'GPT-2 (small)',
            enabled: false,
            shape: gpt2ShapeSmall,
            offset: delta.mul(-5),
            modelCardOffset: delta.mul(-2.0),
            blockRender: initBlockRender(render?.ctx ?? null),
            camera: makeCamera(new Vec3(-65141.321, 0.000, -69843.439), new Vec3(224.459, 24.501, 1574.240)),
        }, {
            // 已隐藏（enabled: false）：界面与场景都不再显示，配置代码保留以便日后恢复
            name: 'GPT-2 (XL)',
            enabled: false,
            shape: gpt2ShapeLarge,
            offset: delta.mul(20),
            modelCardOffset: delta.mul(0.5),
            blockRender: initBlockRender(render?.ctx ?? null),
            camera: makeCamera(new Vec3(237902.688, 0.000, -47282.484), new Vec3(311.959, 23.501, 1382.449)),
        }, {
            // GPT-3：已恢复显示（之前为 enabled:false）。相机由布局包围盒自动推算。
            name: 'GPT-3',
            enabled: true,
            shape: gpt3Shape,
            offset: delta.mul(50.0),
            modelCardOffset: delta.mul(15.0),
            blockRender: initBlockRender(render?.ctx ?? null),
            camera: fitCameraFor(gpt3Shape, delta.mul(50.0)),
        }, {
            // DeepSeek-V3 规模示意（相机数值由该形状的实际包围盒推算得出）
            name: 'DeepSeek-V3（规模示意）',
            enabled: true,
            shape: deepSeekShape,
            offset: delta.mul(20),
            modelCardOffset: delta.mul(0.5),
            blockRender: initBlockRender(render?.ctx ?? null),
            camera: makeCamera(new Vec3(225120.122, -12190.841, -377665.139), new Vec3(238.959, 10.501, 6929.409)),
        }, {
            // Kimi K2.6 规模示意：相机由布局包围盒自动推算
            name: 'Kimi K2.6（规模示意）',
            enabled: true,
            shape: kimiShape,
            offset: delta.mul(80.0),
            modelCardOffset: delta.mul(0.5),
            blockRender: initBlockRender(render?.ctx ?? null),
            camera: fitCameraFor(kimiShape, delta.mul(80.0)),
        }, {
            // Qwen3-235B-A22B 规模示意：相机由布局包围盒自动推算
            name: 'Qwen3-235B-A22B（规模示意）',
            enabled: true,
            shape: qwenShape,
            offset: delta.mul(110.0),
            modelCardOffset: delta.mul(0.5),
            blockRender: initBlockRender(render?.ctx ?? null),
            camera: fitCameraFor(qwenShape, delta.mul(110.0)),
        }, {
            // Llama 4 Maverick 规模示意：相机由布局包围盒自动推算
            name: 'Llama 4 Maverick（规模示意）',
            enabled: true,
            shape: llamaShape,
            offset: delta.mul(140.0),
            modelCardOffset: delta.mul(0.5),
            blockRender: initBlockRender(render?.ctx ?? null),
            camera: fitCameraFor(llamaShape, delta.mul(140.0)),
        }],
        gptGpuModel: null,
        jsGptModel: null,
        stepModel: false,
        markDirty: () => { },
        htmlSubs: new Subscriptions(),
        mouse: {
            mousePos: new Vec3(),
        },
        movement: {
            action: null,
            actionHover: null,
            target: [0, 0],
            depth: 1,
            cameraLerp: null,
         },
        display: {
            tokenColors: null,
            tokenIdxColors: null,
            tokenOutputColors: null,
            lines: [],
            hoverTarget: null,
            dimHover: null,
            blkIdxHover: null,
        },
        pageLayout: {
            height: 0,
            width: 0,
            isDesktop: true,
            isPhone: true,
        }
    };
}

export function runProgram(view: IRenderView, state: IProgramState) {
    let timer0 = performance.now();

    if (!state.render) {
        return;
    }

    resetRenderBuffers(state.render);
    state.render.sharedRender.activePhase = RenderPhase.Opaque;
    state.display.lines = [];
    state.display.hoverTarget = null;
    state.display.tokenColors = null;
    state.display.tokenIdxColors = null;

    if (state.wasmGptModel && state.jsGptModel) {
        syncWasmDataWithJsAndGpu(state.wasmGptModel, state.jsGptModel);
    }

    if (state.stepModel && state.wasmGptModel && state.jsGptModel) {
        state.stepModel = false;
        stepWasmModel(state.wasmGptModel, state.jsGptModel);
    }

    // generate the base model, incorporating the gpu-side model if available
    state.layout = genGptModelLayout(state.shape, state.jsGptModel);

    // @TODO: handle different models in the same scene.
    // Maybe need to copy a lot of different things like the entire render state per model?
    for (let example of state.examples) {
        if (example.enabled && !example.layout) {
            let layout = genGptModelLayout(example.shape, null, example.offset);
            example.layout = layout;
        }
    }

    genModelViewMatrices(state, state.layout!);

    let queryRes = beginQueryAndGetPrevMs(state.render.queryManager, 'render');
    if (isNotNil(queryRes)) {
        state.render.lastGpuMs = queryRes;
    }

    state.render.renderTiming = false; // state.pageLayout.isDesktop;

    // will modify layout; view; render a few things.
    if (state.inWalkthrough) {
        runWalkthrough(state, view);
    }

    updateCamera(state, view);

    drawBlockInfo(state);
    // these will get modified by the walkthrough (stored where?)
    drawAllArrows(state.render, state.layout);

    drawModelCard(state, state.layout, 'nano-gpt', new Vec3());
    // drawTokens(state.render, state.layout, state.display);

    for (let example of state.examples) {
        if (example.enabled && example.layout) {
            drawModelCard(state, example.layout, example.name, example.offset.add(example.modelCardOffset));
        }
    }

    // manageMovement(state, view);
    runMouseHitTesting(state);
    state.render.sharedRender.activePhase = RenderPhase.Opaque;
    drawBlockLabels(state.render, state.layout);

    let lineNo = 1;
    let tw = state.render.size.x;
    state.render.sharedRender.activePhase = RenderPhase.Overlay2D;
    for (let line of state.display.lines) {
        let opts: IFontOpts = { color: new Vec4(), size: 14 };
        let w = measureText(state.render.modelFontBuf, line, opts);
        drawText(state.render.modelFontBuf, line, tw - w - 4, lineNo * opts.size * 1.3 + 4, opts)
        lineNo++;
    }

    // render everything; i.e. here's where we actually do gl draw calls
    // up until now, we've just been putting data in cpu-side buffers
    renderModel(state);

    endQuery(state.render.queryManager, 'render');
    state.render.gl.flush();

    state.render.lastJsMs = performance.now() - timer0;
}
