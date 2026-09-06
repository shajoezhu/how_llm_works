import { Vec3 } from "@/src/utils/vector";
import { Phase } from "./Walkthrough";
import { commentary, IWalkthroughArgs, setInitialCamera } from "./WalkthroughTools";

export function walkthrough05_Softmax(args: IWalkthroughArgs) {
    let { walkthrough: wt, state } = args;

    if (wt.phase !== Phase.Input_Detail_Softmax) {
        return;
    }

    setInitialCamera(state, new Vec3(-24.350, 0.000, -1702.195), new Vec3(283.100, 0.600, 1.556));

    let c0 = commentary(wt, null, 0)`

softmax 运算作为自注意力的一部分被使用，正如上一节所见，它也会出现在模型的最后端。

它的目标是取一个向量并归一化其值，使其总和为 1.0。然而，它并不像除以总和那样简单。相反，每个输入值会先被取指数。

  a = exp(x_1)

这样做的效果是使所有值都为正。一旦我们得到由取指数后的值组成的向量，就可以将每个值除以所有值的总和。这将确保值的总和为 1.0。由于所有取指数后的值都为正，我们知道结果值将介于 0.0 和 1.0 之间，从而对原始值提供一个概率分布。

这就是 softmax 的全部内容：简单地对值取指数，然后除以总和。

然而，这里存在一个小问题。如果某些输入值相当大，那么取指数后的值也会非常大。我们最终会用一个大数除以一个非常大的数，这可能会导致浮点运算出现问题。

softmax 运算有一个有用的性质：如果我们给所有输入值加上一个常数，结果将保持不变。因此我们可以找到输入向量中的最大值，并从所有值中减去它。这确保了最大值为 0.0，并使 softmax 在数值上保持稳定。

让我们在自注意力层的背景下看一看 softmax 运算。我们对每次 softmax 运算的输入向量是自注意力矩阵的一行（但只到对角线为止）。

与层归一化类似，我们有一个中间步骤，在其中存储一些聚合值以保持过程的高效。

对于每一行，我们存储该行的最大值以及偏移并取指数后的值的总和。然后，为了生成对应的输出行，我们可以执行一小组操作：减去最大值、取指数、再除以总和。

“softmax”这个名字是怎么来的？这个运算的“硬”版本称为 argmax，它只是找到最大值，将其设为 1.0，并将所有其他值设为 0.0。相比之下，softmax 运算充当了它的一个“更软”的版本。由于 softmax 中涉及指数运算，最大值被强调并被推向 1.0，同时还保持对所有输入值的概率分布。这使得表示更加细腻，不仅捕捉最可能选项，还捕捉其他选项的相对可能性。
`;

}
