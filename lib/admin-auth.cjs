const {randomBytes,scrypt:derive,timingSafeEqual}=require('node:crypto');const{promisify}=require('node:util');const scrypt=promisify(derive);
const UID='meflix-admin-console';
class AccessError extends Error{constructor(status,message){super(message);this.status=status;}}
const validPin=pin=>typeof pin==='string'&&/^\d{4}$/.test(pin);
async function hashPin(pin){if(!validPin(pin))throw new AccessError(400,'Use exactly 4 digits.');const salt=randomBytes(16).toString('hex');const hash=(await scrypt(pin,salt,64)).toString('hex');return{salt,pinHash:hash};}
async function matches(pin,state){if(!validPin(pin))return false;const actual=await scrypt(pin,state.salt,64);const expected=Buffer.from(state.pinHash,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
function createAdminAuth(store,{initialPin,now=Date.now}={}){
 async function state(){let current=await store.read();if(current)return current;if(!validPin(initialPin))throw new AccessError(503,'Admin PIN setup is required on the server.');const hashed=await hashPin(initialPin);return store.transaction(saved=>saved||{...hashed,pinVersion:1,changedAt:now()});}
 async function verifySession(token){const decoded=await store.verifyToken(token);const current=await state();if(decoded.uid!==UID||decoded.admin!==true||decoded.pinVersion!==current.pinVersion)throw new AccessError(401,'Console is locked. Enter your PIN again.');return decoded;}
 return{
  async login(pin){const current=await state();if(!await matches(pin,current))throw new AccessError(401,'Incorrect PIN.');return{token:await store.issueToken(UID,{admin:true,pinVersion:current.pinVersion})};},
  async session(token){await verifySession(token);return{authorized:true};},
  async changePin(token,currentPin,newPin){await verifySession(token);if(!validPin(newPin))throw new AccessError(400,'Use exactly 4 digits.');const saved=await state();if(!await matches(currentPin,saved))throw new AccessError(401,'Current PIN is incorrect.');if(newPin===currentPin)throw new AccessError(400,'Choose a different PIN.');const hashed=await hashPin(newPin);await store.transaction(current=>{if(current.pinVersion!==saved.pinVersion)throw new AccessError(409,'PIN changed in another session. Sign in again.');return{...current,...hashed,pinVersion:current.pinVersion+1,changedAt:now()};});await store.revokeTokens(UID).catch(()=>{});return{changed:true,signInAgain:true};}
 };
}
module.exports={createAdminAuth,AccessError,hashPin,validPin,UID};
