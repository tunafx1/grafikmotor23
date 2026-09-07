import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBatchPages, generateBatchTexts } from '../src/utils/batchProduction';
import type { DesignTemplate, SequenceMediaItem, TemplatePage } from '../src/types';
function layout(id: string, count: number, role: any): TemplatePage { return {id, name:id, pageRole:role, fixedElements:[], regions:[{id:'title', name:'Başlık', type:'text', placeholderText:'Önceki başlık', isDynamic:true}, ...Array.from({length:count}, (_,i) => ({id:`image-${i}`, type:'image', isDynamic:true}))] as any}; }
const template = {id:'source',name:'Şablon',regions:[],fixedElements:[],pages:[layout('cover',1,'cover'),layout('two',2,'2-image'),layout('one',1,'1-image')]} as unknown as DesignTemplate;
const photos = (n: number): SequenceMediaItem[] => Array.from({length:n},(_,i)=>({id:`${i}`,type:'image',url:`photo-${i}`,thumbnailUrl:`photo-${i}`}));
test('12 photos populate cover and collages in order without dropping or repeating files',()=>{
 const input=photos(12); const before=JSON.stringify(template); const pages=buildBatchPages(template,input);
 assert.equal(pages.length,7); assert.deepEqual(pages.flatMap(p=>Object.values(p.dynamicImages).map((i:any)=>i.url)),input.map(i=>i.url)); assert.equal(JSON.stringify(template),before);
 pages[0].regions[0].name='Changed'; assert.equal(template.pages![0].regions[0].name,'Başlık');
});
test('single-frame fallback consumes every photo',()=>{ const pages=buildBatchPages({...template,pages:[layout('only',1,'cover')]},photos(5));assert.equal(pages.length,5); });
test('unused slots are hidden, static image decorations are not replaced',()=>{
 const page=layout('only',3,'cover'); page.regions.push({id:'logo',type:'image',placeholderImage:'data:image/png;base64,logo'} as any);
 const result=buildBatchPages({...template,pages:[page]},photos(2)); assert.deepEqual(result[0].hiddenElements,['image-2']); assert.equal(result[0].dynamicImages.logo,undefined);
});
test('empty photo selection and templates without frames fail explicitly',()=>{assert.throws(()=>buildBatchPages(template,[]));assert.throws(()=>buildBatchPages({...template,pages:[layout('empty',0,'cover')]},photos(2)),/alan yok/);});
test('AI receives shared brief for every page and retry preserves successful text',async()=>{
 const pages=buildBatchPages(template,photos(3)); let calls=0;
 const request=async(payload:any)=>{calls++;assert.match(payload.brief,/Yıl sonu/); if(calls===2)throw new Error('Quota'); return {title:'Başarılı'};};
 const options={signal:new AbortController().signal,onProgress:()=>{},request};
 const result=await generateBatchTexts(template,pages,'Yıl sonu',options);
 assert.equal(result[0].dynamicTexts.title,'Başarılı');assert.equal(result[1].dynamicTexts.title,'Önceki başlık');assert.equal(result[1].productionError,'Quota');
 let retried=0; const retry=await generateBatchTexts(template,result,'Yıl sonu',{...options,retryOnly:true,request:async()=>{retried++;return {title:'Tekrar'};}});
 assert.equal(retried,1);assert.equal(retry[0].dynamicTexts.title,'Başarılı');assert.equal(retry[1].dynamicTexts.title,'Tekrar');assert.equal(retry[1].productionError,undefined);
});
test('abort stops before creating content',async()=>{const controller=new AbortController();controller.abort();await assert.rejects(generateBatchTexts(template,buildBatchPages(template,photos(1)),'brief',{signal:controller.signal,onProgress:()=>{}}));});
