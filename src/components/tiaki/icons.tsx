import {
  FileText,
  Car,
  Home as HomeIcon,
  Plane,
  Users,
  PawPrint,
  Bell,
  Wrench,
  Lock,
  type LucideIcon,
} from "lucide-react";
import type { CategoryId } from "@/lib/tiaki-storage";

export const CATEGORY_ICON: Record<CategoryId, LucideIcon> = {
  documents: FileText,
  vehicles: Car,
  home: HomeIcon,
  travel: Plane,
  family: Users,
  pets: PawPrint,
  reminders: Bell,
  maintenance: Wrench,
  personal: Lock,
};
