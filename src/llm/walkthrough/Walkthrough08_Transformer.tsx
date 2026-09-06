import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";

export function walkthrough08_Transformer(args: IWalkthroughArgs) {
    let { walkthrough: wt, state } = args;

    if (wt.phase !== Phase.Input_Detail_Transformer) {
        return;
    }

    setInitialCamera(state, new Vec3(-135.531, 0.000, -353.905), new Vec3(291.100, 13.600, 5.706));

    let c0 = commentary(wt, null, 0)`

这就是一个完整的 Transformer 模块！

它们构成了任何 GPT 模型的主要部分，并被重复堆叠多次，一个模块的输出会馈入下一个模块，延续着残差通路。

正如深度学习中常见的那样，很难准确说明每个层究竟在做什么，但我们还是有一些大致的认识：较早的层往往侧重于学习
低层次的特征和模式，而较晚的层则学会识别和理解
更高层次的抽象与关系。在自然语言处理的语境下，较低的层可能学习语法、句法和简单的词语关联，而较高的层
则可能捕捉更复杂的语义关系、语篇结构以及依赖于上下文的含义。

`;

}
