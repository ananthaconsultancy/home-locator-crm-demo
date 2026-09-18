// Home Locator workflow engine. Independent demo; no ClientFirst connection.
// All mutations pass through applyAction. A rejected action leaves the input unchanged.
export const AGENTS = ['Aarav Shah', 'Meera Rao', 'Vikram Das'];
export const STAGES = ['Live Initials', 'Contacting', 'Qualified', 'Site Visit Scheduled', 'Site Visit Done', 'Won', 'Lost'];
export const RULES = [
 ['Lead intake','Name + valid phone + source → responsible rep → Live Initials → first-call task.','Reference: deck pp. 3, 9. Demo choice: round-robin assignment and first call due in 1 hour.'],
 ['Contact & qualification','Connected requires requirement, budget, urgency, interested project, notes and a future follow-up. RNR / Not connected requires notes and a retry date.','Reference: deck pp. 4, 9. Demo choice: RNR never automatically closes a lead.'],
 ['Follow-up discipline','One open sales task per active lead. Logging contact replaces it. Overdue tasks surface on the overview.','Reference: deck p. 10 and mind map. Video confirms D1–D4 are dashboard shortcuts. Demo dashboard contents are reconstructed.'],
 ['Site visits','Qualified lead → dated project visit → visit completion with notes → continued follow-up.','Reference: deck pp. 7, 10. Demo choice: only one pending visit per lead.'],
 ['Lead transfer','Change responsible rep, transfer open tasks and pending visits, retain the complete history.','Reference: deck p. 7. Ownership propagation is a proposed implementation rule.'],
 ['Closure & disposition','Won requires sale value, closure date, incentives and notes. Lost / Not Interested requires a reason and notes. Both close outstanding tasks and cancel pending visits.','Reference: deck pp. 7, 10. Task cancellation and closure guards are demo implementation choices.'],
 ['Seller / Data conversion','Validate contact or property fields → create Lead or Inventory → retain origin and target IDs. Repeat conversion returns the existing record.','Reference: deck pp. 5–6. Duplicate detection and idempotency are proposed safeguards.'],
 ['Visibility & traceability','Rep view filters assigned records; manager view shows the team. Every accepted action records its event and timestamp.','Reference: deck p. 3. The role switch is a UI simulation, not authentication.']
];
export const active = lead => !['Won','Lost'].includes(lead.stage);
export const normalizePhone = value => String(value||'').replace(/\D/g,'');
const need = (condition,message) => { if(!condition) throw new Error(message); };
const text = value => String(value??'').trim();
const at = (now,hours) => new Date(new Date(now).getTime()+hours*3600000).toISOString();
const future = (value,now,label='Next follow-up') => { need(value && Number.isFinite(Date.parse(value)) && Date.parse(value)>Date.parse(now),`${label} must be in the future.`); return new Date(value).toISOString(); };
const note = value => {need(text(value).length>=3,'Add notes with at least 3 characters.');return text(value);};
const agent = (value,state) => {const names=state?.modules?.users.filter(u=>u.status==='Active').map(u=>u.name)||AGENTS;need(names.includes(value),'Choose an active responsible rep.');return value;};
const phone = value => {const n=normalizePhone(value);need(n.length>=10&&n.length<=15,'Enter a phone number with 10–15 digits.');return n;};
function id(s,prefix){return `${prefix}-${++s.sequence}`;}
function event(s,l,type,notes,now){const e={id:id(s,'EV'),leadId:l?.id||null,type,notes,at:now};s.events.unshift(e);if(l)l.updatedAt=now;}
function replaceTask(s,l,kind,due,now){s.tasks.filter(t=>t.leadId===l.id&&t.status==='Open').forEach(t=>{t.status='Completed';t.completedAt=now;});s.tasks.push({id:id(s,'TK'),leadId:l.id,owner:l.owner,kind,due,status:'Open'});}
function createLead(s,d,now,origin=null){
 need(text(d.name),'Customer name is required.');const number=phone(d.phone);need(!s.leads.some(l=>normalizePhone(l.phone)===number),'A lead with this phone number already exists.');
 need(text(d.source),'Lead source is required.');
 const names=s.modules?.users.filter(u=>u.status==='Active').map(u=>u.name)||AGENTS;need(names.length,'At least one active user is required.');const owner=d.owner?agent(d.owner,s):names[s.assignmentIndex++%names.length];
 const lead={id:id(s,'HL'),name:text(d.name),phone:number,email:text(d.email),source:text(d.source),owner,stage:'Live Initials',requirement:text(d.requirement),budget:0,urgency:'',currentProject:'',project:'',followupCount:0,origin,createdAt:now,updatedAt:now};
 s.leads.unshift(lead);replaceTask(s,lead,'First call',at(now,1),now);event(s,lead,'Lead created',`Assigned to ${owner}. First-call task created.${origin?' Converted from '+origin.kind+' '+origin.id+'.':''}`,now);return lead;
}
export function applyAction(input,action,now=new Date().toISOString()){
 need(Number.isFinite(Date.parse(now)),'Invalid demo clock.');
 const s=structuredClone(input),d=action.data||{};let resultId=null,message='Workflow updated.';
 if(action.type==='createLead'){const l=createLead(s,d,now);resultId=l.id;message='Lead created, assigned, and first-call task opened.';}
 else if(action.type==='createSource'){
  need(['Sellers','Data'].includes(d.kind),'Choose Sellers or Data.');need(text(d.name),'Name is required.');const n=phone(d.phone);need(!s.sources.some(r=>r.kind===d.kind&&r.phone===n),'This contact already exists in that source pool.');
  const r={id:id(s,d.kind==='Sellers'?'SEL':'DAT'),kind:d.kind,name:text(d.name),phone:n,owner:agent(d.owner,s),project:text(d.project),unit:text(d.unit),bhk:text(d.bhk),area:Number(d.area)||0,floor:text(d.floor),tower:text(d.tower),leadId:null,inventoryId:null};s.sources.unshift(r);event(s,null,'Source record created',`${r.kind} ${r.id}: ${r.name}`,now);resultId=r.id;message='Source record created.';
 }
 else if(action.type==='convert'){
  const r=s.sources.find(x=>x.id===action.sourceId);need(r,'Source record was not found.');need(['Lead','Inventory'].includes(d.target),'Choose a conversion target.');
  const key=d.target==='Lead'?'leadId':'inventoryId';
  if(r[key])return {state:s,resultId:r[key],message:`Already converted: ${r[key]}. No duplicate created.`};
  if(d.target==='Lead'){
   const existing=s.leads.find(l=>normalizePhone(l.phone)===normalizePhone(r.phone));need(!existing,`A lead with this phone already exists${existing?' ('+existing.id+')':''}. No duplicate created.`);
   const l=createLead(s,{...r,source:r.kind+' conversion'},now,{kind:r.kind,id:r.id});r.leadId=l.id;resultId=l.id;
  }else{
   need(text(d.project)&&text(d.unit)&&text(d.bhk),'Project, unit and configuration are required.');need(Number(d.area)>0,'Area must be greater than zero.');need(Number(d.price)>0,'Asking price must be greater than zero.');
   need(!s.inventory.some(p=>p.project.toLowerCase()===text(d.project).toLowerCase()&&p.unit.toLowerCase()===text(d.unit).toLowerCase()),'This project and unit already exist in inventory.');
   const p={id:id(s,'INV'),project:text(d.project),unit:text(d.unit),bhk:text(d.bhk),area:Number(d.area),price:Number(d.price),tower:text(d.tower),floor:text(d.floor),owner:r.owner,seller:r.name,origin:{kind:r.kind,id:r.id}};s.inventory.unshift(p);r.inventoryId=p.id;resultId=p.id;event(s,null,'Inventory created',`${p.id} from ${r.kind} ${r.id}; project ${p.project}, unit ${p.unit}.`,now);
  }
  message=`Converted to ${d.target}. Source link preserved.`;
 }else{
  const l=s.leads.find(x=>x.id===action.leadId);need(l,'Lead was not found.');need(active(l),'This lead is closed. Reset the demo to start again.');resultId=l.id;
  if(action.type==='call'){
   need(['Connected','Not connected','RNR'].includes(d.outcome),'Choose a call outcome.');const notes=note(d.notes),due=future(d.next,now);
   if(d.outcome==='Connected'){
    need(text(d.requirement),'Requirement is required for a connected call.');need(Number(d.budget)>0,'Budget must be greater than zero.');need(text(d.project),'Interested project is required.');need(['Within 1 month','1–3 months','3–6 months','Exploring'].includes(d.urgency),'Choose a buying timeline.');
    Object.assign(l,{requirement:text(d.requirement),budget:Number(d.budget),project:text(d.project),currentProject:text(d.currentProject),urgency:d.urgency});
    if(['Live Initials','Contacting'].includes(l.stage))l.stage='Qualified';
   }else if(l.stage==='Live Initials')l.stage='Contacting';
   if(l.contacted)l.followupCount+=1;l.contacted=true;
   replaceTask(s,l,d.outcome==='Connected'?'Follow-up':`${d.outcome} retry`,due,now);event(s,l,`Call: ${d.outcome}`,notes,now);message='Call saved. Next follow-up created.';
  }else if(action.type==='followup'){
   const notes=note(d.notes),due=future(d.next,now);l.followupCount+=1;replaceTask(s,l,'Follow-up',due,now);event(s,l,'Follow-up recorded',notes,now);message='Follow-up recorded and next task created.';
  }else if(action.type==='scheduleVisit'){
   need(['Qualified','Site Visit Done'].includes(l.stage),'Qualify the lead before scheduling a site visit.');need(!s.visits.some(v=>v.leadId===l.id&&v.status==='Scheduled'),'A visit is already scheduled.');need(text(d.project),'Visit project is required.');const when=future(d.when,now,'Site visit'),next=future(d.next,now);need(Date.parse(next)>Date.parse(when),'Follow-up must be after the site visit.');const notes=note(d.notes);
   const v={id:id(s,'VIS'),leadId:l.id,owner:l.owner,project:text(d.project),when,status:'Scheduled'};s.visits.push(v);l.stage='Site Visit Scheduled';replaceTask(s,l,'Post-visit follow-up',next,now);event(s,l,'Site visit scheduled',`${v.project} · ${when}. ${notes}`,now);message='Visit scheduled with a post-visit follow-up.';
  }else if(action.type==='completeVisit'){
   const v=s.visits.find(x=>x.leadId===l.id&&x.status==='Scheduled');need(v,'No scheduled visit was found.');need(Date.parse(v.when)<=Date.parse(now),'Advance the demo clock to the visit time before marking it done.');const notes=note(d.notes),next=future(d.next,now);v.status='Done';v.completedAt=now;l.stage='Site Visit Done';replaceTask(s,l,'Post-visit follow-up',next,now);event(s,l,'Site visit completed',`${v.project}. ${notes}`,now);message='Visit completed and follow-up scheduled.';
  }else if(action.type==='transfer'){
   const owner=agent(d.owner,s);need(owner!==l.owner,'Choose a different rep.');const notes=note(d.notes),previous=l.owner;l.owner=owner;s.tasks.filter(t=>t.leadId===l.id&&t.status==='Open').forEach(t=>t.owner=owner);s.visits.filter(v=>v.leadId===l.id&&v.status==='Scheduled').forEach(v=>v.owner=owner);event(s,l,'Lead transferred',`${previous} → ${owner}. ${notes}`,now);message='Lead and open work transferred.';
  }else if(action.type==='close'){
   need(['Won','Lost'].includes(d.outcome),'Choose Won or Lost.');const notes=note(d.notes);
   if(d.outcome==='Won'){
    need(['Qualified','Site Visit Scheduled','Site Visit Done'].includes(l.stage),'Qualify the lead before closing as Won.');need(Number(d.saleValue)>0,'Sale value must be greater than zero.');need(d.incentives!==''&&d.incentives!==undefined&&Number(d.incentives)>=0,'Enter incentives; use 0 if none.');need(d.closedDate&&Number.isFinite(Date.parse(d.closedDate))&&d.closedDate<=now.slice(0,10)&&d.closedDate>=l.createdAt.slice(0,10),'Closure date must be between lead creation and the demo date.');Object.assign(l,{saleValue:Number(d.saleValue),incentives:Number(d.incentives),closedDate:d.closedDate});
   }else{need(['Not interested','Budget mismatch','Location mismatch','Purchased elsewhere','Invalid enquiry','Other'].includes(d.reason),'Choose a lost reason.');l.lostReason=d.reason;}
   l.stage=d.outcome;s.tasks.filter(t=>t.leadId===l.id&&t.status==='Open').forEach(t=>{t.status='Cancelled';t.completedAt=now;});s.visits.filter(v=>v.leadId===l.id&&v.status==='Scheduled').forEach(v=>v.status='Cancelled');event(s,l,`Lead ${d.outcome}`,`${d.reason?d.reason+'. ':''}${notes}`,now);message=`Lead marked ${d.outcome}. Open work closed.`;
  }else throw new Error('Unknown workflow action.');
 }
 return {state:s,resultId,message};
}
export function seedState(now=new Date().toISOString()){
 const s={sequence:200,assignmentIndex:0,leads:[],tasks:[],visits:[],events:[],sources:[],inventory:[]};
 const names=['Riya Mehta','Arjun Nair','Neha Kapoor','Karthik Iyer','Priya Sen','Aditya Rao','Sara Khan','Rahul Verma','Ananya Das'];
 names.forEach((name,i)=>{const l=createLead(s,{name,phone:'900000000'+(i+1),source:['Website','Campaign','Referral'][i%3]},at(now,-72));l.requirement=['2 BHK apartment','3 BHK apartment','3 BHK villa'][i%3];l.project=['Cedar Heights','Lakeview Residences','Orchard Grove'][i%3];l.budget=[8500000,14000000,19000000][i%3];l.urgency='1–3 months';l.currentProject='';l.stage=['Qualified','Live Initials','Contacting','Site Visit Scheduled','Site Visit Done','Qualified','Won','Lost','Site Visit Scheduled'][i];l.contacted=l.stage!=='Live Initials';l.followupCount=[2,0,1,3,4,1,4,2,2][i];const t=s.tasks.find(t=>t.leadId===l.id);t.due=at(now,[-5,1,-2,25,6,4,0,0,30][i]);t.kind=i===1?'First call':i===2?'RNR retry':'Follow-up';if(!active(l))t.status='Completed';if(l.stage==='Won'){l.saleValue=12500000;l.incentives=125000;l.closedDate=now.slice(0,10);}if(l.stage==='Lost')l.lostReason='Budget mismatch';if(l.stage==='Site Visit Scheduled')s.visits.push({id:id(s,'VIS'),leadId:l.id,owner:l.owner,project:l.project,when:at(now,i===3?2:8),status:'Scheduled'});event(s,l,'Sample history',i===1?'Website enquiry received; first call pending.':'Sample customer discussed requirements. Next action recorded.',at(now,-24));});
 s.sources=[{id:'SEL-101',kind:'Sellers',name:'Dev Malhotra',phone:'9000000101',owner:AGENTS[0],project:'Cedar Heights',unit:'A-1204',tower:'A',floor:'12',bhk:'3 BHK',area:1680,leadId:null,inventoryId:null},{id:'SEL-102',kind:'Sellers',name:'Isha Menon',phone:'9000000102',owner:AGENTS[1],project:'Lakeview Residences',unit:'B-803',tower:'B',floor:'8',bhk:'2 BHK',area:1280,leadId:null,inventoryId:null},{id:'DAT-101',kind:'Data',name:'Rohan Joshi',phone:'9000000201',owner:AGENTS[2],project:'',unit:'',bhk:'',area:0,leadId:null,inventoryId:null},{id:'DAT-102',kind:'Data',name:'Tara Sethi',phone:'9000000202',owner:AGENTS[0],project:'Orchard Grove',unit:'V-18',bhk:'3 BHK',area:2400,leadId:null,inventoryId:null}];
 s.inventory=[{id:'INV-101',project:'Cedar Heights',unit:'A-902',bhk:'2 BHK',area:1240,price:8500000,tower:'A',floor:'9',owner:AGENTS[0],seller:'Sample listing',origin:{kind:'Seed',id:'DEMO-1'}},{id:'INV-102',project:'Lakeview Residences',unit:'B-1502',bhk:'3 BHK',area:1810,price:14000000,tower:'B',floor:'15',owner:AGENTS[1],seller:'Sample listing',origin:{kind:'Seed',id:'DEMO-2'}},{id:'INV-103',project:'Orchard Grove',unit:'V-12',bhk:'3 BHK',area:2450,price:19000000,tower:'Villa',floor:'G+1',owner:AGENTS[2],seller:'Sample listing',origin:{kind:'Seed',id:'DEMO-3'}}];
 return s;
}

