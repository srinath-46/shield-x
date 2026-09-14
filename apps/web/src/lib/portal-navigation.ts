export const adminNavigation = [
  ['Dashboard', '/admin'],
  ['Subscription', '/admin/subscription'],
  ['License', '/admin/license'],
  ['Supervisors', '/admin/supervisors'],
  ['Sites', '/admin/sites'],
  ['Profile', '/admin/profile'],
  ['Settings', '/admin/settings'],
].map(([label, href]) => ({ label, href }));