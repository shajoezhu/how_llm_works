'use client';
import React from 'react';
import s from './layout.module.scss';
import '@/styles/main.css';
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { ASSET_BASE } from '@/src/llm/assetBase'
config.autoAddCss = false;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <html lang="zh-CN" className={s.html}>
        <head>
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto&family=Merriweather:ital@0;1&display=optional" />
        </head>
        <body className={s.body}>{children}</body>
    </html>;
}

/* <head>
            <link rel="preload" href={`${ASSET_BASE}/fonts/font-atlas.png`} as="image" />
            <link rel="preload" href={`${ASSET_BASE}/fonts/font-def.json`} as="fetch" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto&family=Merriweather:ital@0;1" />
</head> */
