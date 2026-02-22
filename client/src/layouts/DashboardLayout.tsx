import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
  isSidebarClosed?: boolean;
  customSidebarItems?: {
    id: string;
    label: string;
    onClick: () => void;
    isActive?: boolean;
    icon?: any;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onShare?: (id: string) => void;
  }[];
  customSidebarTitle?: string;
  showSidebarLogo?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  hideHeader,
  isSidebarClosed = false,
  customSidebarItems,
  customSidebarTitle,
  showSidebarLogo = true
}) => {
  return (
    <div className="flex bg-gray-50 min-h-screen relative overflow-x-hidden w-full">
      {/* Sidebar container with transition */}
      <aside
        className={`fixed inset-y-0 left-0 z-[100] w-64 transition-transform duration-300 ease-in-out transform shadow-2xl ${isSidebarClosed ? '-translate-x-full' : 'translate-x-0'
          }`}
      >
        <Sidebar
          customItems={customSidebarItems}
          customTitle={customSidebarTitle}
          showLogo={showSidebarLogo}
        />
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0 ${isSidebarClosed ? 'ml-0' : 'ml-64'
          }`}
      >
        {!hideHeader && <Header />}
        <main className={`flex-1 ${hideHeader ? 'p-0' : 'p-8 pb-12'}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
