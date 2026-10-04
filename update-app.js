const fs = require('fs');
let app = fs.readFileSync('server/src/app.ts', 'utf8');
if (!app.includes('clientTemplateRoutes')) {
  app = app.replace("import tabdealRoutes from './routes/tabdeal.routes';", "import tabdealRoutes from './routes/tabdeal.routes';\nimport clientTemplateRoutes from './routes/client-template.routes';");
  app = app.replace("app.use(\n    '/api/tabdeal',\n    apiLimiter,\n    tabdealRoutes\n  );", "app.use(\n    '/api/tabdeal',\n    apiLimiter,\n    tabdealRoutes\n  );\n\n  app.use(\n    '/api/client-templates',\n    apiLimiter,\n    clientTemplateRoutes\n  );");
  fs.writeFileSync('server/src/app.ts', app);
}
