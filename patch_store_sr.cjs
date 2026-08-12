const fs = require('fs');
let content = fs.readFileSync('src/store.ts', 'utf8');

content = content.replace(
  "submitServiceRequest: (date: string, message: string) => Promise<void>;",
  "submitServiceRequest: (date: string, message: string) => Promise<void>;\n  approveServiceRequest: (id: string) => Promise<void>;\n  declineServiceRequest: (id: string) => Promise<void>;"
);

const newMethods = `  approveServiceRequest: async (id) => {
    set(state => ({
      serviceRequests: state.serviceRequests.map(req => req.id === id ? { ...req, status: 'approved' } : req)
    }));
  },
  declineServiceRequest: async (id) => {
    set(state => ({
      serviceRequests: state.serviceRequests.map(req => req.id === id ? { ...req, status: 'rejected' } : req)
    }));
  },`;

content = content.replace(
  "  submitServiceRequest: async (date, message) => {",
  newMethods + "\n\n  submitServiceRequest: async (date, message) => {"
);

fs.writeFileSync('src/store.ts', content);
