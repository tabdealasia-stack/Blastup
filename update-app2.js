const fs = require('fs');
let app = fs.readFileSync('server/src/app.ts', 'utf8');
if (!app.includes('clientTemplateRoutes')) {
  app = app.replace("import tabdealRoutes from './routes/tabdeal.routes';", "import tabdealRoutes from './routes/tabdeal.routes';\r\nimport clientTemplateRoutes from './routes/client-template.routes';");
  
  // just insert it before return app;
  app = app.replace("return app;", "app.use('/api/client-templates', apiLimiter, clientTemplateRoutes);\r\n  return app;");
  fs.writeFileSync('server/src/app.ts', app);
}
