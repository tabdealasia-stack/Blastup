const fs = require('fs');
const path = './client/src/app/(tabdeal)/tabdeal/clients/[id]/ClientTemplatesSection.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix handleAssign
content = content.replace(
  /const vars = assignCustomVariables[\s\S]*?tabdealApi\.createClientTemplate\(\{/m,
  \const rawVars = assignCustomVariables.split('\\n').map(v => v.trim()).filter(v => v.length > 0);
    const hasMalformed = rawVars.some(v => !v.includes('='));
    if (hasMalformed) {
      toast.error('Invalid variable format. Each variable must use key=value.');
      setIsAssigning(false);
      return;
    }

    try {
      await tabdealApi.createClientTemplate({\
);
content = content.replace(
  /customVariables: vars\.length > 0 \? vars : undefined,/,
  \customVariables: rawVars.length > 0 ? rawVars : undefined,\
);

// Fix handleEditSave
content = content.replace(
  /const vars = editCustomVariables[\s\S]*?tabdealApi\.updateClientTemplate\(editingId, \{/m,
  \const rawVars = editCustomVariables.split('\\n').map(v => v.trim()).filter(v => v.length > 0);
    const hasMalformed = rawVars.some(v => !v.includes('='));
    if (hasMalformed) {
      toast.error('Invalid variable format. Each variable must use key=value.');
      setIsSaving(false);
      return;
    }

    try {
      await tabdealApi.updateClientTemplate(editingId, {\
);

content = content.replace(
  /customMessage: editCustomMessage\.trim\(\) \|\| undefined,/,
  \customMessage: editCustomMessage.trim() || "",\
);

content = content.replace(
  /customVariables: vars\.length > 0 \? vars : \[\],/,
  \customVariables: rawVars.length > 0 ? rawVars : [],\
);

// Fix Accessibility labels

// assignTemplateId
content = content.replace(
  /<label className="block text-xs font-semibold text-gray-700 mb-1">Master Notification Template<\/label>\s*<select/,
  \<label htmlFor="assignTemplateId" className="block text-xs font-semibold text-gray-700 mb-1">Master Notification Template</label>\\n              <select id="assignTemplateId"\
);

// assignCustomMessage
content = content.replace(
  /<label className="block text-xs font-semibold text-gray-700 mb-1">Custom Message Override<\/label>\s*<textarea\s*className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"\s*rows=\{3\}\s*placeholder="Leave empty to use the Master Template message."\s*value=\{assignCustomMessage\}/,
  \<label htmlFor="assignCustomMessage" className="block text-xs font-semibold text-gray-700 mb-1">Custom Message Override</label>\\n              <textarea id="assignCustomMessage" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" rows={3} placeholder="Leave empty to use the Master Template message." value={assignCustomMessage}\
);

// assignCustomVariables
content = content.replace(
  /<label className="block text-xs font-semibold text-gray-700 mb-1">Custom Variables<\/label>\s*<textarea\s*className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono px-3 py-2 border"\s*rows=\{3\}\s*placeholder=\{\customer_name=John\\ngreeting=Hello VIP\\}\s*value=\{assignCustomVariables\}/,
  \<label htmlFor="assignCustomVariables" className="block text-xs font-semibold text-gray-700 mb-1">Custom Variables</label>\\n              <textarea id="assignCustomVariables" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono px-3 py-2 border" rows={3} placeholder={\customer_name=John\\ngreeting=Hello VIP\} value={assignCustomVariables}\
);

// editCustomMessage
content = content.replace(
  /<label className="block text-xs font-semibold text-gray-700 mb-1">Custom Message Override<\/label>\s*<textarea\s*className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border"\s*rows=\{3\}\s*placeholder="Leave empty to use the Master Template message."\s*value=\{editCustomMessage\}/,
  \<label htmlFor="editCustomMessage" className="block text-xs font-semibold text-gray-700 mb-1">Custom Message Override</label>\\n              <textarea id="editCustomMessage" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-3 py-2 border" rows={3} placeholder="Leave empty to use the Master Template message." value={editCustomMessage}\
);

// editCustomVariables
content = content.replace(
  /<label className="block text-xs font-semibold text-gray-700 mb-1">Custom Variables<\/label>\s*<textarea\s*className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono px-3 py-2 border"\s*rows=\{3\}\s*placeholder=\{\customer_name=John\\ngreeting=Hello VIP\\}\s*value=\{editCustomVariables\}/,
  \<label htmlFor="editCustomVariables" className="block text-xs font-semibold text-gray-700 mb-1">Custom Variables</label>\\n              <textarea id="editCustomVariables" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 font-mono px-3 py-2 border" rows={3} placeholder={\customer_name=John\\ngreeting=Hello VIP\} value={editCustomVariables}\
);

fs.writeFileSync(path, content, 'utf8');
console.log("Done");
