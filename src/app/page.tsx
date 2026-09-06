import React from 'react';
import LlmPage from './llm/page';

export const metadata = {
    title: 'LLM 可视化',
    description: '一个带有分步讲解的 LLM 三维动画可视化。',
};

export default function Page() {
    return <LlmPage />;
}
