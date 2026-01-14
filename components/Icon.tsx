import React from 'react';
import {
  CheckCircle2 as CheckCircle,
  AlertTriangle as Warning,
  AlertCircle as Error,
  Info,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Home,
  User,
  Users,
  FileText as Document,
  Clock,
  BarChart3 as Chart,
  Download,
  Upload,
  Search,
  Filter,
  ArrowUpDown as Sort,
  Settings,
  Menu,
  X as Close,
  Plus,
  Minus,
  Pencil as Edit,
  Trash2 as Trash,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Star,
  Heart,
  Bookmark,
  Folder,
  File,
  Clipboard,
  Copy,
  RefreshCw as Refresh,
  Loader2 as Spinner,
  Share2 as Share,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose as SidebarCollapse,
  PanelLeftOpen as SidebarExpand,
  Play,
  List,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IconName =
  | 'check-circle'
  | 'warning'
  | 'error'
  | 'info'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'home'
  | 'user'
  | 'users'
  | 'document'
  | 'clock'
  | 'chart'
  | 'download'
  | 'upload'
  | 'search'
  | 'filter'
  | 'sort'
  | 'settings'
  | 'menu'
  | 'close'
  | 'plus'
  | 'minus'
  | 'edit'
  | 'trash'
  | 'eye'
  | 'eye-off'
  | 'lock'
  | 'unlock'
  | 'star'
  | 'heart'
  | 'bookmark'
  | 'folder'
  | 'file'
  | 'clipboard'
  | 'copy'
  | 'refresh'
  | 'spinner'
  | 'share'
  | 'chevron-down'
  | 'chevron-up'
  | 'chevron-left'
  | 'chevron-right'
  | 'sidebar-collapse'
  | 'sidebar-expand'
  | 'play'
  | 'list'
  | 'file-text';

interface IconProps {
  name: IconName;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const iconMap: Record<IconName, LucideIcon> = {
  'check-circle': CheckCircle,
  'warning': Warning,
  'error': Error,
  'info': Info,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'home': Home,
  'user': User,
  'users': Users,
  'document': Document,
  'clock': Clock,
  'chart': Chart,
  'download': Download,
  'upload': Upload,
  'search': Search,
  'filter': Filter,
  'sort': Sort,
  'settings': Settings,
  'menu': Menu,
  'close': Close,
  'plus': Plus,
  'minus': Minus,
  'edit': Edit,
  'trash': Trash,
  'eye': Eye,
  'eye-off': EyeOff,
  'lock': Lock,
  'unlock': Unlock,
  'star': Star,
  'heart': Heart,
  'bookmark': Bookmark,
  'folder': Folder,
  'file': File,
  'clipboard': Clipboard,
  'copy': Copy,
  'refresh': Refresh,
  'spinner': Spinner,
  'share': Share,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'sidebar-collapse': SidebarCollapse,
  'sidebar-expand': SidebarExpand,
  'play': Play,
  'list': List,
  'file-text': FileText,
};

const sizeClasses = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export default function Icon({ name, size = 'md', className = '' }: IconProps) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const isSpinner = name === 'spinner';
  
  return (
    <IconComponent
      className={cn(
        sizeClasses[size],
        className,
        isSpinner && 'animate-spin'
      )}
      strokeWidth={1.5}
    />
  );
}
