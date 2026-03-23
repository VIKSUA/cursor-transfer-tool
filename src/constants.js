export const SAFE_STATE_KEYS = [
  "agentLayout.shared.v6",
  "cursor/agentLayout.sidebarLocation",
  "cursor/agentLayout.sidebarLocationAgentOverride",
  "cursor/globalLayoutState",
  "cursor/unifiedAppLayout",
  "mcpService.knownServerIds",
  "tabs-list-width-horizontal",
  "workbench.sideBar.size",
  "workbench.unifiedSidebar.size",
  "workbench.view.agents.hidden",
  "workbench.view.extension.codexViewContainer.state.hidden"
];

export const FILES_TO_COPY = [
  {
    id: "settings",
    relativeSource: ["User", "settings.json"],
    relativePackage: ["files", "roaming", "User", "settings.json"],
    relativeTarget: ["User", "settings.json"]
  },
  {
    id: "keybindings",
    relativeSource: ["User", "keybindings.json"],
    relativePackage: ["files", "roaming", "User", "keybindings.json"],
    relativeTarget: ["User", "keybindings.json"]
  }
];
