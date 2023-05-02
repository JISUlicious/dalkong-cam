import "../styles/App.scss";
import "../styles/Sidebar.scss";

interface SidebarProps {
  isSidebarOpen: boolean
}

export function Sidebar ({isSidebarOpen}: SidebarProps) {
  const hide = isSidebarOpen ? "" : "hide";
  return <div
    className={`sidebar ${hide}`}
  >
    <h1>Sidebar</h1>
  </div>;
}