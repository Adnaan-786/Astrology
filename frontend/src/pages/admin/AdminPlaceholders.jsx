// Placeholder pages for other admin sections

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, Bot, FileText, Crown, Percent, Wallet, Image, 
  Bell, MessageSquare, HeadphonesIcon, List, Package
} from "lucide-react";

const PlaceholderSection = ({ title, icon: Icon, description }) => (
  <div data-testid={`admin-${title.toLowerCase().replace(/\s+/g, '-')}-page`}>
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white">{title}</h1>
      <p className="text-slate-400">{description}</p>
    </div>
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-12 text-center">
        <Icon className="w-16 h-16 mx-auto mb-4 text-slate-600" />
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-slate-400 mb-4">This section is ready for full implementation.</p>
        <Badge className="bg-purple-600">Coming Soon</Badge>
      </CardContent>
    </Card>
  </div>
);

export const AdminSessions = () => (
  <PlaceholderSection 
    title="Live Sessions" 
    icon={Zap} 
    description="Monitor active consultations in real-time"
  />
);

export const AdminAIReports = () => (
  <PlaceholderSection 
    title="AI Reports" 
    icon={Bot} 
    description="View and manage AI-generated reports"
  />
);

export const AdminBlog = () => (
  <PlaceholderSection 
    title="Blog Management" 
    icon={FileText} 
    description="Create and manage blog posts"
  />
);

export const AdminPlans = () => (
  <PlaceholderSection 
    title="Plans & Pricing" 
    icon={Crown} 
    description="Manage subscription plans and pricing"
  />
);

export const AdminCoupons = () => (
  <PlaceholderSection 
    title="Coupons & Offers" 
    icon={Percent} 
    description="Create and manage discount coupons"
  />
);

export const AdminFinance = () => (
  <PlaceholderSection 
    title="Wallet & Finance" 
    icon={Wallet} 
    description="Revenue reports and transaction management"
  />
);

export const AdminBanners = () => (
  <PlaceholderSection 
    title="Banners" 
    icon={Image} 
    description="Manage promotional banners"
  />
);

export const AdminNotifications = () => (
  <PlaceholderSection 
    title="Notifications" 
    icon={Bell} 
    description="Send notifications to users"
  />
);

export const AdminReviews = () => (
  <PlaceholderSection 
    title="Reviews" 
    icon={MessageSquare} 
    description="Moderate user reviews"
  />
);

export const AdminSupport = () => (
  <PlaceholderSection 
    title="Support Tickets" 
    icon={HeadphonesIcon} 
    description="Handle customer support requests"
  />
);

export const AdminAudit = () => (
  <PlaceholderSection 
    title="Audit Log" 
    icon={List} 
    description="Track all admin actions"
  />
);

export const AdminOrders = () => (
  <PlaceholderSection 
    title="Orders" 
    icon={Package} 
    description="Manage product orders"
  />
);
