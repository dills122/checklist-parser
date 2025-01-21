import path from 'path';
import ChecklistParser from './src/pdf-parser';
import assert from 'assert';
import { writeFile } from 'fs/promises';

(async () => {
  // try {
  console.log('Running');
  const testChecklistPath = path.join(process.cwd(), 'test-files', 'Test-Checklist.pdf');
  // const testChecklistPath = path.join(process.cwd(), 'test-files', 'EUR2402-24UCEO_Checklist_V2.pdf');
  const checklistParser = new ChecklistParser();
  await checklistParser.loadFile(testChecklistPath);
  const checklistJson = await checklistParser.parse(false);
  console.log('Finished Parsing');
  console.log(checklistJson);
  assert(Object.keys(checklistJson).length, 'Checklist has length greater than 0');
  for (const [key, value] of Object.entries(checklistJson)) {
    assert(key.length, `Key exists - ${key}`);
    assert(value.length, `Each checklist Categorey is non-empty, ${key}`);
  }

  const stringyJson = JSON.stringify(checklistJson, null, 4);
  try {
    await writeFile('./test-files/checklist.json', stringyJson, 'utf8');
  } catch (err) {
    console.error(JSON.stringify(err, null, 2));
  }
})();
