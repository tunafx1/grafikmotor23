import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTextPrompt, createTextGenerationHandler, parseTextRequest, validateTextResult} from '../api/text-generation';
import {getAiTextFields, requestAiText} from '../src/utils/aiText';

const fields = [{id:'headline',name:'Web başlığı',role:'title',text:'Önceki başlık'}, {id:'body',name:'Açıklama',role:'description',text:'Korunacak açıklama'}];
const payload = {systemPrompt:'Bir müze için yaz. Fiyat belirtme. En fazla dört kelimelik başlık kullan.',templateName:'Müze',brief:'Yeni sergi',fields:[fields[0]],context:fields};

function responseRecorder() {
  return {code:200, body:null as any,status(code:number){this.code=code;return this;},json(body:any){this.body=body;return this;}};
}

test('single-field request retains template prompt and other fields only as context', () => {
  const input = parseTextRequest(payload);
  const prompt = buildTextPrompt(input);
  assert.ok(prompt.includes(payload.systemPrompt));
  assert.ok(prompt.includes('Korunacak açıklama'));
  assert.equal(input.fields.length, 1);
  assert.equal(input.fields[0].id, 'headline');
  assert.match(prompt, /Renk, yerleşim, başka alan/);
});

test('AI endpoint returns generated text with requested ID and no palette', async () => {
  let received: any;
  const handler = createTextGenerationHandler({hasKey:()=>true,generate:async input => {received=input;return {texts:[{id:'headline',text:'  Yeni Sergiyi Keşfet  '}]};}});
  const res = responseRecorder();
  await handler({body:payload} as any,res as any);
  assert.equal(received.systemPrompt, payload.systemPrompt);
  assert.equal(res.code,200);
  assert.deepEqual({...res.body.texts},{headline:'Yeni Sergiyi Keşfet'});
  assert.equal(res.body.primaryColor,undefined);
});

test('AI endpoint preserves valid fields and retries only fields omitted by the model', async () => {
  const requests: string[][] = [];
  const twoFieldPayload = {...payload, fields, context: fields};
  const handler = createTextGenerationHandler({hasKey:()=>true,generate:async input => {
    requests.push(input.fields.map(field => field.id));
    return requests.length === 1
      ? {texts:[{id:'headline',text:'Yeni Başlık'}]}
      : {texts:[{id:'body',text:'Yeni açıklama'}]};
  }});
  const res = responseRecorder();
  await handler({body:twoFieldPayload} as any,res as any);
  assert.equal(res.code,200);
  assert.deepEqual(requests,[['headline','body'],['body']]);
  assert.deepEqual({...res.body.texts},{headline:'Yeni Başlık',body:'Yeni açıklama'});
});

test('missing credentials, quota, and malformed model output return errors rather than sample content', async () => {
  for (const scenario of [
    {hasKey:()=>false,generate:async()=>assert.fail('No provider call without key'),code:503},
    {hasKey:()=>true,generate:async()=>{throw new Error('429 quota');},code:429},
    {hasKey:()=>true,generate:async()=>({texts:[{id:'body',text:'wrong field'}]}),code:502},
  ]) {
    const res = responseRecorder();
    await createTextGenerationHandler(scenario)({body:payload} as any,res as any);
    assert.equal(res.code,scenario.code);
    assert.equal(res.body.success,false);
    assert.equal(res.body.texts,undefined);
    assert.ok(res.body.error);
  }
});

test('invalid or duplicate fields are rejected before calling Gemini', async () => {
  const handler = createTextGenerationHandler({hasKey:()=>true,generate:async()=>assert.fail('Invalid request must not reach provider')});
  for (const body of [{...payload,fields:[]},{...payload,fields:[fields[0],fields[0]]},{...payload,systemPrompt:123}]) {
    const res=responseRecorder(); await handler({body} as any,res as any); assert.equal(res.code,400);
  }
  assert.throws(()=>validateTextResult({texts:[{id:'headline',text:'one'},{id:'headline',text:'two'}]},fields));
});

test('field buttons include current text and exclude static, hidden, and image regions', () => {
  const regions:any[] = [
    {id:'headline',name:'Başlık',type:'text',textRole:'title',placeholderText:'Örnek'},
    {id:'logo',type:'text',isDynamic:false}, {id:'hidden',type:'text',hidden:true}, {id:'image',type:'image'},
  ];
  assert.deepEqual(getAiTextFields(regions,{headline:'Güncel başlık'}),[{id:'headline',name:'Başlık',role:'title',prompt:'',text:'Güncel başlık'}]);
});

test('field-specific prompt is included with its category', () => {
  const regions:any[] = [{id:'cta',name:'Buton',type:'text',textRole:'callToAction',aiPrompt:'En fazla iki kelime kullan.',placeholderText:'İncele'}];
  const [field] = getAiTextFields(regions,{});
  assert.equal(field.role,'callToAction');
  assert.equal(field.prompt,'En fazla iki kelime kullan.');
  assert.match(buildTextPrompt(parseTextRequest({...payload,fields:[field],context:[field]})),/En fazla iki kelime kullan/);
});

test('client applies only requested field IDs and rejects fallback, HTTP, and incomplete responses', async () => {
  const fetcher = (data:any,status=200) => (async (_url:any, init:any) => {
    const sent=JSON.parse(init.body); assert.deepEqual(sent.fields,payload.fields);
    return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  }) as typeof fetch;
  const signal = new AbortController().signal;
  const result = await requestAiText(payload,signal,fetcher({success:true,texts:{headline:'Yeni',body:'Dokunma'},primaryColor:'#000'}));
  assert.deepEqual(result,{headline:'Yeni'});
  for (const [data,status] of [
    [{success:true,isFallback:true,texts:{headline:'Örnek'}},200],
    [{success:false,error:'Anahtar eksik'},503],
    [{success:true,texts:{body:'Yanlış alan'}},200],
  ] as const) await assert.rejects(requestAiText(payload,signal,fetcher(data,status)));
});
