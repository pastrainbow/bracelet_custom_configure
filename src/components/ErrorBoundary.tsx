import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last-resort guard around the whole widget: a render crash must degrade to a
 * friendly message instead of blanking the host (product) page. Engine/canvas
 * errors don't reach this — they surface through the store's ErrorToast.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown): void {
    // eslint-disable-next-line no-console
    console.error('[BraceletConfigurator] crashed', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="bcfg flex h-full min-h-[600px] flex-col items-center justify-center gap-3 px-6 text-center max-[639px]:h-[100dvh] max-[639px]:min-h-0">
          <p className="text-[14px] font-semibold text-ink">
            Something went wrong loading the bracelet builder.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-surface px-4 py-2 text-[13px] font-semibold text-ink shadow-panel transition-colors hover:bg-white"
          >
            Reload the page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
