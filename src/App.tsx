import { useEffect } from 'react';
import type { ConfiguratorOptions } from '@/shopify/integration';
import { useStore } from '@/store/store';
import { Header } from './components/Header';
import { Studio } from './components/Studio';
import { Sidebar } from './components/Sidebar';
import { ErrorToast } from './components/ErrorToast';
import { ShareView } from './components/ShareView';

export interface AppProps {
  options?: ConfiguratorOptions;
}

export function App({ options = {} }: AppProps) {
  const setOptions = useStore((s) => s.setOptions);

  // Make host options available to the store before the engine mounts.
  useEffect(() => {
    setOptions(options);
  }, [options, setOptions]);

  return (
    <div className="bcfg relative flex h-full min-h-[600px] flex-col max-[639px]:h-[100dvh] max-[639px]:min-h-0">
      <ErrorToast />
      <Header wristHint={options.wristHint} />
      <div className="grid min-h-0 flex-1 grid-cols-[1fr_300px] overflow-hidden max-[1024px]:grid-cols-[1fr_240px] max-[639px]:flex max-[639px]:flex-col">
        <Studio />
        <Sidebar />
      </div>
      <ShareView />
    </div>
  );
}
