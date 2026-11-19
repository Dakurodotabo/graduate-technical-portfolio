const assert=require('node:assert/strict');
const base='http://127.0.0.1:3000';
async function request(path, options={}){
 const res=await fetch(base+path,options);
 const txt=await res.text();
 let body;try{body=JSON.parse(txt)}catch{body=txt};
 return {status:res.status,body};
}
(async()=>{
 for(const p of ['/','/Home.HTML','/Login.HTML','/Signup.HTML','/Forum.HTML','/Profile.HTML','/auth.js']){
  let r=await request(p); assert.equal(r.status,200,p); console.log('PAGE',p,r.status);
 }
 let denied=await request('/backend/users.json'); assert.equal(denied.status,404,'user data must not be publicly accessible');console.log('PRIVATE DATA ACCESS BLOCKED');
 let r=await request('/api/posts');assert.equal(r.status,200);
 assert.ok(Array.isArray(r.body));console.log('POSTS GET PASS');
 const email='demo'+Date.now()+'@example.test';
 r=await request('/api/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Portfolio Test',email,password:'demopass2026'})});
 assert.equal(r.status,201,JSON.stringify(r.body)); console.log('REGISTER PASS');
 r=await request('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'demopass2026'})});
 assert.equal(r.status,200,JSON.stringify(r.body)); const user=r.body.user;
 assert.ok(user.id); console.log('LOGIN PASS');
 let form=new FormData();form.set('title','Test post');form.set('content','Smoke test');
 r=await request('/api/posts',{method:'POST',headers:{'x-user-id':String(user.id)},body:form});
 assert.equal(r.status,201,JSON.stringify(r.body));
 const id=r.body.id;console.log('CREATE FORUM POST PASS');
 r=await request('/api/posts/'+id,{method:'DELETE',headers:{'x-user-id':String(user.id)}});
 assert.equal(r.status,200,JSON.stringify(r.body));console.log('DELETE FORUM POST PASS');
 console.log('ALL SMOKE TESTS PASSED');
})().catch(e=>{console.error(e);process.exit(1)});
