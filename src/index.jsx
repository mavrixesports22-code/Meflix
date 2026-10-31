import React from 'react';
import { render } from 'react-dom';
import { firebaseConfig } from '../public/firebase-config.js';
import { AdminApp } from './AdminApp.jsx';
let pending;
function loadFirebase(){
  if(pending)return pending;
  pending=(async()=>{
    const [appSdk,authSdk,dataSdk]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js'),
    ]);
    const app=appSdk.initializeApp(firebaseConfig),auth=authSdk.getAuth(app);
    await authSdk.setPersistence(auth,authSdk.browserLocalPersistence);
    return {app,auth,db:dataSdk.getFirestore(app),...dataSdk,
      onAuthStateChanged:authSdk.onAuthStateChanged,
      signInWithCustomToken:authSdk.signInWithCustomToken,signOut:authSdk.signOut};
  })().catch(()=>{pending=null;throw new Error('Unable to connect to Firebase. Please retry.');});
  return pending;
}
render(<AdminApp loadFirebase={loadFirebase}/>,document.getElementById('root'));
