import fs from 'fs';
import os from 'os';
import path from 'path';

import { compressJson } from './jsonCompressor';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

import { dayjs } from './dayjs';
import { initializeAdmin } from './firebaseAdmin';

async function exportCollection(collectionPaths: string[]) {
  
  const app = initializeAdmin();
  for (const collectionPath of collectionPaths) {
    const collectionRef = app.firestore().collection(collectionPath);
    console.info(`Reading ${collectionPath} collection ...`);
    const docRefs = await collectionRef.listDocuments();
    const docs = await Promise.all(docRefs.map((docRef) => docRef.get()));
    const dataList = docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
    console.info(`Read ${docRefs.length} documents ...`);
    fs.writeFileSync(path.join(dirPath, `${normalizedCollectionName}.json`), JSON.stringify(dataList));



    for (const arg of argv._) {
      const collectionName = arg.toString();
      const collectionRef = app.firestore().collection(collectionName);
      console.log(`Read ${collectionName} ...`);
      const docRefs = await collectionRef.listDocuments();
      console.log('done');
      const dataList = docs.map((doc) => ({ docId: doc.id, ...doc.data() }));
      const timestamp = dayjs().format('YYYY-MM-DD_HH-mm');
      const normalizedCollectionName = collectionName.replaceAll('/', '-');
      const filePaths = [
        path.join(dirPath, `${normalizedCollectionName}.json.gz`),
        path.join(dirPath, `${normalizedCollectionName}-${timestamp}.json.gz`),
      ];
      const driveDirPath = `${os.homedir()}/Google Drive/マイドライブ/SIP分析用ファイル/ルネ高`;
      if (environment === 'production' && fs.existsSync(driveDirPath)) {
        filePaths.push(path.join(driveDirPath, `${normalizedCollectionName}-${timestamp}.json.gz`));
      }
      compressJson(dataList, ...filePaths);
      console.log(`Wrote: ${filePaths}`);
      fs.writeFileSync(path.join(dirPath, `${normalizedCollectionName}.json`), JSON.stringify(dataList));
    }
  }

  main().then();

}

