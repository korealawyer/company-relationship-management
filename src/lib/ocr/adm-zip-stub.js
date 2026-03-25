// adm-zip browser stub — prevents Turbopack from bundling Node.js module in client
// This file is only used as a browser alias; server-side code uses the real adm-zip
module.exports = class AdmZipStub {
  constructor() { throw new Error('adm-zip is not available in browser. Use API routes for DOCX/HWPX processing.'); }
};
