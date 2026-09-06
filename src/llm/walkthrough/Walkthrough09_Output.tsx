import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";

export function walkthrough09_Output(args: IWalkthroughArgs) {
    let { walkthrough: wt, state } = args;

    if (wt.phase !== Phase.Input_Detail_Output) {
        return;
    }

    setInitialCamera(state, new Vec3(-20.203, 0.000, -1642.819), new Vec3(281.600, -7.900, 2.298));

    let c0 = commentary(wt, null, 0)`

最后，我们来到了模型的末端。最终 Transformer 块的输出会先经过一次层归一化，
然后我们使用一个线性变换（矩阵乘法），这一次不带偏置。

这个最终的变换将我们的每一列向量从长度 C 变为长度 nvocab。因此，
它实际上是在为词汇表中的每个词、为我们每一列都产生一个分数。这些
分数有一个专门的名称：logits。

"logits" 这个名字来源于 "log-odds"（对数几率），即每个词元几率的对数。"Log"（对数）是
因为接下来我们应用的 softmax 会做一次指数运算，从而转换为"几率"或概率。

为了把这些分数转换为合适的概率，我们让它们通过一次 softmax 运算。现在，
对于每一列，我们都有了模型赋予词汇表中每个词的概率。

在这个特定的模型中，它实际上已经学会了如何对三个字母进行排序的所有答案，
所以概率都高度集中在正确答案上。

当我们在时间上逐步推进模型时，我们会用最后一列的概率来决定要
加入序列的下一个词元。例如，如果我们向模型输入了六个词元，我们就会
使用第 6 列的输出概率。

这一列的输出是一系列概率，而我们实际上必须从中挑选出其中一个，作为
序列中的下一个词元。我们通过"从分布中采样"来实现这一点。也就是说，我们随机
选择一个词元，其被选中的概率与其概率成正比。例如，一个概率为 0.9 的词元会有
90% 的概率被选中。

不过，这里还有其他选择，例如始终选择概率最高的那个词元。

我们还可以通过一个温度参数来控制分布的"平滑程度"。较高的
温度会使分布更加均匀，而较低的温度会使分布更加
集中在概率最高的词元上。

我们的做法是在应用 softmax 之前，将 logits（线性变换的输出）除以温度。
由于 softmax 中的指数运算对较大的数值影响更大，让它们彼此更加接近就会削弱这种影响。
`;

}
