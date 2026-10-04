const fs = require('fs');

let sidebar = fs.readFileSync('client/src/components/layout/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace('item.children ?', "'children' in item && item.children ?");
sidebar = sidebar.replace('item.href', "('href' in item ? item.href : '')");
sidebar = sidebar.replace('pathname === item.href', "pathname === ('href' in item ? item.href : '')");
sidebar = sidebar.replace('pathname === item.href', "pathname === ('href' in item ? item.href : '')");
fs.writeFileSync('client/src/components/layout/Sidebar.tsx', sidebar);
