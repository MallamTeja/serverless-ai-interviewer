import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserRound,
  Users,
  ChevronRight,
  Settings,
  LayoutDashboard,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type TabId = 'interviewee' | 'interviewer' | 'settings' | 'help';

export interface TabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
}

interface MainTabsProps {
  /**
   * Currently active tab
   */
  activeTab: TabId;
  
  /**
   * Callback when tab is changed
   */
  onTabChange: (tabId: TabId) => void;
  
  /**
   * Custom tabs to render
   */
  tabs?: TabItem[];
  
  /**
   * Whether to show notification badges
   * @default true
   */
  showBadges?: boolean;
  
  /**
   * Layout orientation
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical';
  
  /**
   * Size of the tabs
   * @default 'default'
   */
  size?: 'default' | 'sm' | 'lg';
  
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Main navigation tabs for switching between Interviewee and Interviewer views
 */
const MainTabs: React.FC<MainTabsProps> = ({
  activeTab,
  onTabChange,
  tabs,
  showBadges = true,
  orientation = 'horizontal',
  size = 'default',
  className,
}) => {
  // Default tabs if not provided
  const defaultTabs: TabItem[] = [
    {
      id: 'interviewee',
      label: 'Interview',
      icon: <MessageSquare className="h-4 w-4" />,
    },
    {
      id: 'interviewer',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      badge: 5,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="h-4 w-4" />,
    },
    {
      id: 'help',
      label: 'Help',
      icon: <HelpCircle className="h-4 w-4" />,
    },
  ];
  
  // Use provided tabs or default ones
  const navTabs = tabs || defaultTabs;
  
  // Determine if we should use mobile view (stacked)
  const isMobileView = window.innerWidth < 640;
  const isVertical = orientation === 'vertical' || isMobileView;
  
  // Get size-specific classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs py-1.5 px-2';
      case 'lg':
        return 'text-base py-3 px-6';
      default:
        return 'text-sm py-2 px-4';
    }
  };
  
  // Styles for non-shadcn tabs option - for more custom tab styling
  const getButtonTabClasses = (tabId: string) => {
    return cn(
      'flex items-center gap-2 rounded-md transition-all',
      isVertical ? 'justify-start w-full' : 'justify-center',
      getSizeClasses(),
      activeTab === tabId
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
    );
  };
  
  // Render custom button tabs
  const renderButtonTabs = () => (
    <div className={cn(
      'flex gap-1 p-1 rounded-lg border bg-background',
      isVertical ? 'flex-col w-full' : 'flex-row'
    )}>
      {navTabs.map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          className={getButtonTabClasses(tab.id)}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {showBadges && tab.badge && (
            <Badge variant="secondary" className="ml-auto">
              {tab.badge}
            </Badge>
          )}
        </Button>
      ))}
    </div>
  );
  
  // Render shadcn/ui tabs
  const renderShadcnTabs = () => (
    <Tabs
      defaultValue={activeTab}
      value={activeTab}
      onValueChange={onTabChange}
      orientation={isVertical ? 'vertical' : 'horizontal'}
      className={cn(
        'w-full',
        isVertical ? 'flex flex-col' : ''
      )}
    >
      <TabsList 
        className={cn(
          'bg-muted/60 h-auto w-full',
          isVertical ? 'flex-col' : 'flex justify-start overflow-x-auto'
        )}
      >
        {navTabs.map((tab) => (
          <TabsTrigger 
            key={tab.id}
            value={tab.id}
            className={cn(
              'flex items-center gap-2',
              getSizeClasses(),
              isVertical ? 'justify-start w-full' : ''
            )}
          >
            {tab.icon}
            <span className={isVertical || !isMobileView ? '' : 'hidden sm:inline'}>
              {tab.label}
            </span>
            {showBadges && tab.badge && (
              <Badge 
                variant="secondary" 
                className={cn(
                  'ml-1',
                  activeTab === tab.id ? 'bg-primary-foreground text-primary' : ''
                )}
              >
                {tab.badge}
              </Badge>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
  
  // Render mobile bottom navigation
  const renderMobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background z-10">
      <div className="flex justify-around items-center">
        {navTabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={cn(
              'flex flex-col items-center py-3 rounded-none flex-1 gap-1',
              activeTab === tab.id
                ? 'text-primary border-t-2 border-primary'
                : 'text-muted-foreground'
            )}
            onClick={() => onTabChange(tab.id)}
          >
            <div className="relative">
              {tab.icon}
              {showBadges && tab.badge && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 min-w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {tab.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
  
  // We'll conditionally render different tab styles based on viewport and orientation
  // For this implementation, we'll use shadcn Tabs for desktop and custom buttons for mobile
  
  if (isMobileView) {
    return (
      <div className={cn('w-full', className)}>
        {renderMobileBottomNav()}
        <div className="pb-16">
          {/* Content spacer for fixed bottom nav */}
        </div>
      </div>
    );
  }
  
  return (
    <div className={cn(
      'w-full',
      isVertical ? 'max-w-[200px]' : '',
      className
    )}>
      {renderShadcnTabs()}
    </div>
  );
};

export default MainTabs;
