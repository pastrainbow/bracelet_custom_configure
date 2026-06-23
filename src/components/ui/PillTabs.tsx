import * as Tabs from '@radix-ui/react-tabs';
import { cn } from './cn';

export interface PillTab {
  value: string;
  label: string;
}

interface PillTabsProps {
  tabs: PillTab[];
  value: string;
  onValueChange: (value: string) => void;
  /** 'solid' = filled active pill (super-cat); 'soft' = subtle active (sub-cat). */
  variant?: 'solid' | 'soft';
  className?: string;
}

/**
 * Accessible pill-style tab list built on Radix Tabs. Keyboard navigable and
 * scrolls horizontally when the tabs overflow (mobile sub-categories).
 */
export function PillTabs({ tabs, value, onValueChange, variant = 'solid', className }: PillTabsProps) {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange}>
      <Tabs.List
        className={cn('no-scrollbar flex gap-1 overflow-x-auto', className)}
        aria-label="Categories"
      >
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={cn(
              'flex-shrink-0 cursor-pointer rounded-pill text-xs font-semibold tracking-tight transition-all',
              variant === 'solid'
                ? cn(
                    'border-[1.5px] px-[18px] py-[5px]',
                    'border-border text-muted hover:border-gold hover:text-gold',
                    'data-[state=active]:border-accent data-[state=active]:bg-accent data-[state=active]:text-white',
                  )
                : cn(
                    'px-[14px] py-[5px] font-normal',
                    'text-muted hover:bg-bg',
                    'data-[state=active]:bg-accent data-[state=active]:font-medium data-[state=active]:text-white',
                  ),
            )}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
    </Tabs.Root>
  );
}
