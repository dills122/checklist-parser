import path from 'path';
import ChecklistParser from './src/pdf-parser';
import assert from 'assert';

(async () => {
  // try {
  console.log('Running');
  // const testChecklistPath = path.join(process.cwd(), 'test-files', 'Test-Checklist.pdf');
  const testChecklistPath = path.join(process.cwd(), 'test-files', 'EUR2402-24UCEO_Checklist_V2.pdf');
  const checklistParser = new ChecklistParser();
  await checklistParser.loadFile(testChecklistPath);
  const checklistJson = await checklistParser.parse(true);
  console.log('Finished Parsing');
  console.log(checklistJson);
  assert(Object.keys(checklistJson).length, 'Checklist has length greater than 0');
  for (const [key, value] of Object.entries(checklistJson)) {
    assert(key.length, 'Key exists');
    assert(value.length, 'Each checklist Categorey is non-empty');
  }
  // } catch (err) {
  //   console.error(JSON.stringify(err, null, 2));
  // }
})();
