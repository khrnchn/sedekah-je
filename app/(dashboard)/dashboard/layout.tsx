// app/dashboard/layout.tsx
import React, { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div>
            <main>{children}</main>
        </div>
    );
};

export default DashboardLayout;
