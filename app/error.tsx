'use client';
export default function ErrorBoundary({reset}:{reset:()=>void}){return <main className="error-page"><h1>The road is still here · 道途仍在</h1><p>Your last committed action is saved on this device. / 本机已保存上次完成的行动。</p><button onClick={reset}>Try again / 重试</button></main>;}
