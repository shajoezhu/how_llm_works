import React from 'react';
import { LayerView } from '@/src/llm/LayerView';
import { InfoButton } from '@/src/llm/WelcomePopup';

export const metadata = {
  title: 'LLM 可视化',
  description: '一个带有分步讲解的 LLM 三维动画可视化。',
};

import { Header } from '@/src/homepage/Header';

export default function Page() {
    return <>
        <Header title="LLM 可视化">
            <InfoButton />
        </Header>
        <LayerView />
        <div id="portal-container"></div>
        <footer style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '6px 12px',
            textAlign: 'center',
            fontSize: 12,
            color: '#cfd3dc',
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 1000,
        }}>
            本网站改编自 Brendan Bycroft 的{' '}
            <a href="https://github.com/bbycroft/llm-viz" target="_blank" rel="noreferrer" style={{ color: '#7cc4ff' }}>
                LLM Visualization
            </a>{' '}
            （fork），遵循原项目的 MIT 许可证。
        </footer>
    </>;
}
