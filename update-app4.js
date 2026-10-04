const fs = require('fs');
let app = fs.readFileSync('server/src/app.ts', 'utf8');
app = app.replace("app.use('/api/client-templates', apiLimiter, clientTemplateRoutes);\n  return app;", "return app;");
app = app.replace("app.use(\n    notFoundHandler\n  );", "app.use('/api/client-templates', apiLimiter, clientTemplateRoutes);\n\n  app.use(\n    notFoundHandler\n  );");
fs.writeFileSync('server/src/app.ts', app);
