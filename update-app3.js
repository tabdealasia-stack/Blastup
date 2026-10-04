const fs = require('fs');
let app = fs.readFileSync('server/src/app.ts', 'utf8');
if (!app.includes('/api/client-templates')) {
  app = app.replace("return app;", "app.use('/api/client-templates', apiLimiter, clientTemplateRoutes);\n  return app;");
  fs.writeFileSync('server/src/app.ts', app);
}
