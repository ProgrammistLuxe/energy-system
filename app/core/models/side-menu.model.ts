export interface SideMenu {
  name: string;
  icon: string;
  routerLink?: string | null;
  children: SideMenuChild[];
  isActive?: boolean | null;
}
export interface SideMenuChild {
  name: string;
  routerLink: string;
  isActive?: boolean | null;
}
