const fs = require('fs');
const path = require('path');

const TYPES = [
  'RoleType', 'ModuleStatus', 'ModuleDefinition', 'CaseStatus', 'Issue', 
  'CompanyContact', 'CompanyMemo', 'TimelineEventType', 'CompanyTimelineEvent', 
  'Company', 'LitigationStatus', 'LitigationDeadline', 'LitigationCase', 
  'ConsultStatus', 'ConsultCategory', 'ConsultUrgency', 'Consultation', 
  'PersonalClient', 'PersonalLitStatus', 'PersonalLitType', 'PersonalLitDeadline', 
  'PersonalLitDocument', 'PersonalLitigation', 'WelcomeEmailType', 'SatisfactionSurveyType', 
  'AutoSettings', 'AutoLog', 'SmsLogEntry', 'ConsultItem', 'Document', 'DocumentCategory', 'DocumentStatus', 'ConsultRecord', 'PendingClient', 'CrmNotification'
];

const CONSTANTS = [
  'STATUS_LABEL', 'STATUS_COLOR', 'STATUS_TEXT', 'PIPELINE', 
  'LIT_STATUS_LABEL', 'LIT_STATUS_COLOR', 'LAWYERS', 'SALES_REPS', 
  'LITIGATION_TYPES', 'COURTS', 'CONSULTS', 'SAMPLE_BILLING',
  'PERSONAL_LIT_STATUS_TEXT', 'PERSONAL_LIT_STATUSES', 'PERSONAL_LIT_TYPES',
  'PERSONAL_LIT_STATUS_LABEL', 'SAMPLE_CONSULTS', 'PERSONAL_LIT_STATUS_COLOR',
  'ATTENDANCE_STATUS_LABEL', 'ATTENDANCE_TYPES', 'ATTENDANCE_TYPE_COLOR'
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find import { ... } from '@/lib/store';
    const regex = /import\s+\{([^}]+)\}\s+from\s+['"]@\/lib\/store['"];?/g;
    let match;
    let hasChanges = false;
    
    // Collect all replacements first
    const replacements = [];
    
    while ((match = regex.exec(content)) !== null) {
        const fullMatch = match[0];
        const importsStr = match[1];
        
        let typesToImport = [];
        let constantsToImport = [];
        let othersToImport = [];
        
        const items = importsStr.split(',').map(s => s.trim()).filter(Boolean);
        for (const item of items) {
            const nameMatch = item.match(/^(?:type\s+)?([a-zA-Z0-9_]+)$/);
            const name = nameMatch ? nameMatch[1] : item.split(' ')[0];
            
            if (TYPES.includes(name)) {
                typesToImport.push(item);
            } else if (CONSTANTS.includes(name)) {
                constantsToImport.push(item);
            } else {
                othersToImport.push(item);
            }
        }
        
        let newImports = [];
        if (typesToImport.length > 0) {
            newImports.push(`import { ${typesToImport.join(', ')} } from '@/lib/types';`);
        }
        if (constantsToImport.length > 0) {
            newImports.push(`import { ${constantsToImport.join(', ')} } from '@/lib/constants';`);
        }
        if (othersToImport.length > 0) {
            newImports.push(`import { ${othersToImport.join(', ')} } from '@/lib/store';`);
        }
        
        replacements.push({
            oldText: fullMatch,
            newText: newImports.join('\n')
        });
        hasChanges = true;
    }
    
    if (hasChanges) {
        for (const {oldText, newText} of replacements) {
            content = content.replace(oldText, newText);
        }
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function walk(dir) {
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.next')) {
            walk(filePath);
        } else if (stat.isFile() && (filePath.endsWith('.ts') || filePath.endsWith('.tsx'))) {
            processFile(filePath);
        }
    }
}

const rootDir = path.join(__dirname, '..', 'src');
console.log('Running in:', rootDir);
walk(rootDir);
console.log('Script completed.');
