#!/usr/bin/env node
const{hashPin,validPin,UID}=require('../lib/admin-auth.cjs');
async function main(){
 const pin=process.env.MEFLIX_ADMIN_INITIAL_PIN;
 if(!validPin(pin))throw Error('Set a private four-digit MEFLIX_ADMIN_INITIAL_PIN environment variable first.');
 if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON)throw Error('Set server-only FIREBASE_SERVICE_ACCOUNT_JSON first.');
 const{initializeApp,cert}=require('firebase-admin/app');const{initializeFirestore}=require('firebase-admin/firestore');const{getAuth}=require('firebase-admin/auth');
 const credential=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
 const app=initializeApp({projectId:process.env.FIREBASE_PROJECT_ID||credential.project_id,credential:cert(credential)},'pin-setup');
 const db=initializeFirestore(app,{preferRest:true}),ref=db.doc('admin_settings/security'),hashed=await hashPin(pin);
 await db.runTransaction(async tx=>{const snap=await tx.get(ref),current=snap.exists?snap.data():{};const{pin,password,pass,hash,...retained}=current;tx.set(ref,{...retained,...hashed,pinVersion:(current.pinVersion||0)+1,changedAt:Date.now()});});
 await getAuth(app).revokeRefreshTokens(UID).catch(()=>{});
 console.log('Admin PIN updated in Firebase. Its value and hash were not printed.');
}
main().catch(()=>{console.error('PIN setup failed. Check the private PIN and Firebase server configuration.');process.exitCode=1;});
